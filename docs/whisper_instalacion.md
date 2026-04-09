# Instalación de Whisper para Transcripción de Audio

## ¿Qué es Whisper?

**Whisper** es un modelo de reconocimiento de voz automático (speech-to-text) open source desarrollado por OpenAI. Es muy preciso y soporta múltiples idiomas, incluyendo español.

## Características

- ✅ **Open Source**: Gratuito y de código abierto
- ✅ **Multilingüe**: Soporta 99 idiomas, incluyendo español
- ✅ **Alta Precisión**: Uno de los modelos más precisos disponibles
- ✅ **Ejecución Local**: Procesa el audio en tu servidor, sin enviar datos a terceros
- ✅ **Múltiples Modelos**: 5 tamaños diferentes para balancear velocidad y precisión

## Modelos Disponibles

| Modelo | Tamaño | Velocidad | Precisión | Uso Recomendado |
|---------|----------|-------------|-------------|-------------------|
| tiny | ~39 MB | Muy rápido | Baja | Pruebas rápidas |
| base | ~74 MB | Rápido | Buena | **Uso diario** (recomendado) |
| small | ~244 MB | Medio | Alta | Reuniones importantes |
| medium | ~769 MB | Lento | Muy alta | Documentos críticos |
| large | ~1550 MB | Muy lento | Excelente | Transcripciones profesionales |

## Instalación

### 1. Activar el Entorno Virtual

```bash
cd backend
source venv/bin/activate
```

### 2. Instalar Whisper

```bash
pip install openai-whisper
```

### 3. Instalar Dependencias de Audio (Opcional pero Recomendado)

Para mejor soporte de formatos de audio:

```bash
pip install ffmpeg-python
```

**Nota**: Si estás en Linux, también necesitas instalar FFmpeg:

```bash
sudo apt update
sudo apt install ffmpeg
```

### 4. Verificar Instalación

```bash
python -c "import whisper; print('Whisper instalado correctamente')"
```

Deberías ver: `Whisper instalado correctamente`

## Uso en el Sistema

Una vez instalado, el sistema automáticamente usará Whisper para transcribir audio cuando selecciones la opción "Whisper (Open Source)" en la interfaz del CRM.

### Formatos de Audio Soportados

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- OGG (.ogg)
- FLAC (.flac)

### Límites

- **Tamaño máximo**: 50 MB por archivo
- **Idioma predeterminado**: Español (es)
- **Modelo predeterminado**: base (balance entre velocidad y precisión)

## Configuración Avanzada

### Cambiar el Modelo Predeterminado

Si deseas usar un modelo diferente al predeterminado (base), puedes modificar el archivo [`backend/app/routers/crm.py`](../backend/app/routers/crm.py):

```python
# Línea 273 (aproximadamente)
model_size: str = "base"  # Cambia a: tiny, small, medium, large
```

### Cambiar el Idioma Predeterminado

```python
# Línea 272 (aproximadamente)
language: str = "es"  # Cambia a: en, fr, de, etc.
```

## Rendimiento por Modelo

| Hardware | tiny | base | small | medium | large |
|----------|--------|-------|--------|---------|--------|
| CPU (4 cores) | ~10s | ~30s | ~2min | ~5min | ~10min |
| GPU (NVIDIA) | ~2s | ~5s | ~20s | ~45s | ~2min |

**Nota**: Los tiempos son aproximados para un audio de 1 minuto.

## Solución de Problemas

### Error: "Whisper no está instalado"

**Solución**:
```bash
cd backend
source venv/bin/activate
pip install openai-whisper
```

### Error: "ffmpeg not found"

**Solución** (Linux):
```bash
sudo apt install ffmpeg
```

**Solución** (macOS):
```bash
brew install ffmpeg
```

### Error: "Out of Memory"

Si recibes un error de memoria al usar modelos grandes (medium, large):

**Solución 1**: Usar un modelo más pequeño (base o small)
**Solución 2**: Aumentar la memoria RAM del servidor
**Solución 3**: Usar una GPU con más VRAM

### Error: "CUDA out of memory"

Si estás usando GPU y te quedas sin memoria:

**Solución**: Usar el modelo base o small que requieren menos VRAM

## Comparación: Whisper vs APIs de Pago

| Característica | Whisper (Open Source) | APIs de Pago |
|---------------|------------------------|----------------|
| Costo | Gratis | Pago por uso |
| Privacidad | 100% local | Datos enviados a terceros |
| Velocidad | Depende del hardware | Generalmente más rápido |
| Precisión | Excelente | Excelente |
| Configuración | Requiere instalación | Solo API key |
| Offline | Sí | No |

## Recursos Adicionales

- [Repositorio oficial de Whisper](https://github.com/openai/whisper)
- [Documentación de Whisper](https://github.com/openai/whisper/blob/main/README.md)
- [Modelos de Whisper](https://github.com/openai/whisper#model-variants)

## Soporte

Si tienes problemas con la instalación o uso de Whisper:

1. Revisa la sección de "Solución de Problemas" arriba
2. Verifica que tienes suficiente espacio en disco (mínimo 2 GB libres)
3. Asegúrate de tener Python 3.8 o superior instalado
4. Consulta los logs del servidor para errores específicos

## Prueba de Funcionamiento

Después de instalar Whisper, puedes probarlo subiendo un archivo de audio desde la página de detalle del cliente en el CRM:

1. Ve a la página de un cliente
2. En el "Historial de Actividad", selecciona "Whisper (Open Source)" en el selector
3. Haz clic en "Subir Audio"
4. Selecciona un archivo de audio (mp3, wav, m4a, ogg)
5. Espera a que se complete la transcripción
6. La transcripción aparecerá como una nueva interacción en el historial

¡Listo! Ahora tienes transcripción de audio open source en tu sistema CRM.
