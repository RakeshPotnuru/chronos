import re

def clean_json(text: str) -> str:
    """Sanitize JSON string if the model adds backticks"""
    clean = text.strip()
    if clean.startswith('```json'):
        clean = re.sub(r'^```json', '', clean)
        clean = re.sub(r'```$', '', clean)
    elif clean.startswith('```'):
        clean = re.sub(r'^```', '', clean)
        clean = re.sub(r'```$', '', clean)
    return clean.strip()