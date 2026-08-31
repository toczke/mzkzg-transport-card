import re
import os

def main():
    base_dir = '/home/toczektomasz/Dokumenty/GitHub/polish-public-transport-card/custom_components/mzkzg_transport'
    with open(os.path.join(base_dir, 'provider_gtfsrt.py'), 'r') as f:
        content = f.read()

    # Find _get_tomorrow_departures
    pattern = re.compile(r'^def _get_tomorrow_departures\(.*$', re.MULTILINE)
    match = pattern.search(content)
    if match:
        start_idx = match.start()
        next_func_pattern = re.compile(r'^(def|async def) ', re.MULTILINE)
        next_match = next_func_pattern.search(content, start_idx + 10)
        end_idx = next_match.start() if next_match else len(content)
        
        func_code = content[start_idx:end_idx].strip() + '\n\n'
        
        # append to gtfsrt_parser.py
        with open(os.path.join(base_dir, 'gtfsrt_parser.py'), 'a') as pf:
            pf.write('\n' + func_code)
            
        # remove from provider_gtfsrt.py
        content = content[:start_idx] + content[end_idx:]
        
        # update import
        import_stmt = "from .gtfsrt_parser import _parse_gtfs_zip, _parse_stop_times_for, _parse_stop_times_from_raw, _parse_gtfsrt_positions, _parse_rt_feed\n"
        new_import_stmt = "from .gtfsrt_parser import _parse_gtfs_zip, _parse_stop_times_for, _parse_stop_times_from_raw, _parse_gtfsrt_positions, _parse_rt_feed, _get_tomorrow_departures\n"
        content = content.replace(import_stmt, new_import_stmt)

        with open(os.path.join(base_dir, 'provider_gtfsrt.py'), 'w') as f:
            f.write(content)

if __name__ == "__main__":
    main()
