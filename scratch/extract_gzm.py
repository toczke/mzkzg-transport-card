import re
import os

def main():
    base_dir = '/home/toczektomasz/Dokumenty/GitHub/polish-public-transport-card/custom_components/mzkzg_transport'
    with open(os.path.join(base_dir, 'provider_gtfsrt.py'), 'r') as f:
        content = f.read()

    # We want to extract GZM logic:
    # _fetch_range
    # _peek_zip_member
    # _calendar_covers
    # _get_gzm_gtfs_url

    gzm_funcs = [
        '_fetch_range',
        '_peek_zip_member',
        '_calendar_covers',
        '_get_gzm_gtfs_url'
    ]

    gzm_code = [
        'import logging',
        'import struct',
        'import aiohttp',
        'from datetime import date as dt_date',
        '',
        '_LOGGER = logging.getLogger(__name__)',
        ''
    ]

    for name in gzm_funcs:
        pattern = re.compile(r'^(?:async )?def ' + name + r'\(.*$', re.MULTILINE)
        match = pattern.search(content)
        if match:
            start_idx = match.start()
            next_func_pattern = re.compile(r'^(def|async def) ', re.MULTILINE)
            next_match = next_func_pattern.search(content, start_idx + 10)
            end_idx = next_match.start() if next_match else len(content)
            
            func_code = content[start_idx:end_idx].strip() + '\n\n'
            gzm_code.append(func_code)
            content = content[:start_idx] + content[end_idx:]

    with open(os.path.join(base_dir, 'gtfsrt_gzm.py'), 'w') as f:
        f.write('\n'.join(gzm_code))

    # Add import to provider_gtfsrt.py
    import_statement = "from .gtfsrt_gzm import _get_gzm_gtfs_url\n"
    import_idx = content.find("from .gtfsrt_parser import")
    if import_idx != -1:
        end_import_idx = content.find("\n", import_idx) + 1
        content = content[:end_import_idx] + import_statement + content[end_import_idx:]

    with open(os.path.join(base_dir, 'provider_gtfsrt.py'), 'w') as f:
        f.write(content)

if __name__ == "__main__":
    main()
