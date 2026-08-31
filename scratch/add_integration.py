import json
import uuid

config_file = 'ha-test-config/.storage/core.config_entries'
with open(config_file, 'r') as f:
    data = json.load(f)

# Check if mzkzg_transport exists
exists = any(entry['domain'] == 'mzkzg_transport' for entry in data['data']['entries'])
if not exists:
    new_entry = {
      "entry_id": uuid.uuid4().hex,
      "version": 1,
      "domain": "mzkzg_transport",
      "title": "Gdańsk - Strzyża PKM",
      "data": {
        "provider": "ztm_gdansk",
        "stop_id": "2032"
      },
      "options": {},
      "pref_disable_new_entities": False,
      "pref_disable_polling": False,
      "source": "user",
      "unique_id": "ztm_gdansk_2032",
      "disabled_by": None
    }
    data['data']['entries'].append(new_entry)
    with open(config_file, 'w') as f:
        json.dump(data, f, indent=2)
    print("Integration added successfully!")
else:
    print("Integration already exists.")
