from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.assistant_router import UserContext, get_current_user
from app.db import get_db
from datetime import datetime, timedelta
import collections

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/summary")
async def get_analytics_summary(
    current_user: UserContext = Depends(get_current_user),
    db: Any = Depends(get_db)
):
    """
    Obtiene el resumen de analíticas para el dashboard del SaaS.
    REGLA MULTITENANT: Filtramos estrictamente por el tenant_id.
    """
    try:
        # 1. Obtener todos los clientes del tenant
        customers_res = db.table("crm_customers").select("*").eq("tenant_id", current_user.tenant_id).execute()
        customers = customers_res.data
        
        # 2. Obtener todas las interacciones del tenant
        interactions_res = db.table("crm_interactions").select("*").eq("tenant_id", current_user.tenant_id).execute()
        interactions = interactions_res.data

        # 3. Calcular KPIs
        total_customers = len(customers)
        total_clients = len([c for c in customers if c.get("customer_type") == "client"])
        total_prospects = total_customers - total_clients
        
        # Tasa de conversión (Won / Total)
        won_deals = len([c for c in customers if c.get("status") == "won"])
        conversion_rate = (won_deals / total_customers * 100) if total_customers > 0 else 0
        
        # Uso de IA (Interacciones que contienen el emoji de robot o texto de resumen)
        ai_interactions = len([i for i in interactions if "🎙️" in i.get("description", "") or "🤖" in i.get("description", "")])
        
        # 4. Datos del Embudo (Funnel)
        funnel = [
            {"name": "Prospectos", "value": len([c for c in customers if c.get("status") in ["new", "contacted"]])},
            {"name": "Calificados", "value": len([c for c in customers if c.get("status") == "contacted"])},
            {"name": "Negociación", "value": len([c for c in customers if c.get("status") == "negotiating"])}, # Asumiendo este status existe o se usará
            {"name": "Cerrados", "value": won_deals},
        ]

        # 5. Distribución de Estatus
        status_counts = collections.Counter([c.get("status", "new") for c in customers])
        status_dist = [
            {"name": "Nuevos", "value": status_counts.get("new", 0)},
            {"name": "Contactados", "value": status_counts.get("contacted", 0)},
            {"name": "Ganados", "value": status_counts.get("won", 0)},
            {"name": "Perdidos", "value": status_counts.get("lost", 0)},
        ]

        # 6. Tendencia de Actividad (Últimos 7 días)
        today = datetime.now()
        last_7_days = [(today - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
        activity_trend = []
        
        # Agrupar interacciones por día
        daily_activity = collections.defaultdict(int)
        for i in interactions:
            try:
                # interaction_date puede venir como string ISO
                dt = datetime.fromisoformat(i.get("interaction_date").replace('Z', '+00:00'))
                day_name = dt.strftime("%a") # Eng based, simple enough for mock if needed, but here we calculate it
                daily_activity[day_name] += 1
            except:
                pass
        
        # Mapear días de la semana a nombres en español si es necesario, pero mantengamos coherencia con el frontend
        day_map = {"Mon": "Lun", "Tue": "Mar", "Wed": "Mie", "Thu": "Jue", "Fri": "Vie", "Sat": "Sab", "Sun": "Dom"}
        
        activity_trend = []
        for i in range(6, -1, -1):
            d = (today - timedelta(days=i))
            d_name_en = d.strftime("%a")
            d_name_es = day_map.get(d_name_en, d_name_en)
            
            # Contar clientes creados en ese día also
            new_customers_count = len([c for c in customers if datetime.fromisoformat(c.get("created_at").replace('Z', '+00:00')).date() == d.date()])
            
            activity_trend.append({
                "name": d_name_es,
                "value": new_customers_count * 10, # Multiplicador para visualización
                "interactions": daily_activity.get(d_name_en, 0)
            })

        return {
            "kpis": {
                "total_leads": total_customers,
                "conversion_rate": f"{conversion_rate:.1f}%",
                "ai_usage": ai_interactions,
                "churn_rate": "2.4%" # Mock for now
            },
            "main_trend": activity_trend,
            "funnel": funnel,
            "status_dist": status_dist
        }
    except Exception as e:
        print(f"Error in analytics: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
