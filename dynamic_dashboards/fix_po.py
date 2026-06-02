import codecs

with open('i18n/es.po', 'rb') as f:
    content = f.read()

try:
    # Look for the start of the UTF-16 encoded msgid (null bytes)
    # The string we appended was: msgid "All Time"
    # In UTF-16 LE, 'm' is b'm\x00'
    idx = content.find(b'm\x00s\x00g\x00i\x00d\x00')
    if idx != -1:
        clean_utf8 = content[:idx]
    else:
        # Maybe it's just raw text with wrong newlines?
        clean_utf8 = content
        
    # Let's remove any trailing whitespace/newlines from the clean part
    clean_utf8 = clean_utf8.rstrip() + b'\n\n'
    
    new_strings = '''msgid "All Time"
msgstr "Todo el Tiempo"

msgid "Today"
msgstr "Hoy"

msgid "This Month"
msgstr "Este Mes"

msgid "This Year"
msgstr "Este Año"

msgid "Undefined"
msgstr "Indefinido"

msgid "No dashboards configured yet. Go to Configuration to create one."
msgstr "No hay tableros configurados todavía. Ve a Configuración para crear uno."
'''
    
    with open('i18n/es.po', 'wb') as f:
        f.write(clean_utf8)
        f.write(new_strings.encode('utf-8'))
        
    print('Successfully repaired es.po')
except Exception as e:
    print('Error:', e)
