import re

def main():
    with open('/home/toczektomasz/Dokumenty/GitHub/polish-public-transport-card/custom_components/mzkzg_transport/provider_gtfsrt.py', 'r') as f:
        content = f.read()

    # The functions we want to extract
    func_names = [
        "_read_csv",
        "_parse_gtfs_zip",
        "_parse_stop_times_for",
        "_parse_stop_times_from_raw",
        "_parse_gtfsrt_positions",
        "_parse_rt_feed"
    ]

    parser_code = [
        'import csv',
        'import codecs',
        'import zipfile',
        'import logging',
        'from io import BytesIO',
        'from datetime import date as dt_date',
        '',
        '_LOGGER = logging.getLogger(__name__)',
        ''
    ]

    for name in func_names:
        # Find start of function
        pattern = re.compile(r'^def ' + name + r'\(.*$', re.MULTILINE)
        match = pattern.search(content)
        if match:
            start_idx = match.start()
            # Find the end of the function (the start of the next top-level def or async def)
            next_func_pattern = re.compile(r'^(def|async def) ', re.MULTILINE)
            next_match = next_func_pattern.search(content, start_idx + 10)
            
            if next_match:
                end_idx = next_match.start()
            else:
                end_idx = len(content)
            
            func_code = content[start_idx:end_idx].strip() + '\n\n'
            parser_code.append(func_code)
            content = content[:start_idx] + content[end_idx:]

    # Now add imports to provider_gtfsrt.py
    import_statement = "from .gtfsrt_parser import _read_csv, _parse_gtfs_zip, _parse_stop_times_for, _parse_stop_times_from_raw, _parse_gtfsrt_positions, _parse_rt_feed\n"
    
    # Put import after the last import
    import_idx = content.find("from .gtfsrt_cities import GTFSRT_CITIES")
    if import_idx != -1:
        end_import_idx = content.find("\n", import_idx) + 1
        content = content[:end_import_idx] + import_statement + content[end_import_idx:]

    with open('/home/toczektomasz/Dokumenty/GitHub/polish-public-transport-card/custom_components/mzkzg_transport/gtfsrt_parser.py', 'w') as f:
        f.write('\n'.join(parser_code))
        
    with open('/home/toczektomasz/Dokumenty/GitHub/polish-public-transport-card/custom_components/mzkzg_transport/provider_gtfsrt.py', 'w') as f:
        f.write(content)

if __name__ == "__main__":
    main()
