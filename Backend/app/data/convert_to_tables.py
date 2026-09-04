import pandas as pd

files = ['ratlam_indore_cleaned.csv', 'indore_ratlam_cleaned.csv']
non_time_columns = ['train_no', 'train_name', 'train_type', 'route_via', 'direction', 'distance_km']

trains_rows = []
stops_rows = []
station_codes = set()

for file in files:
    df = pd.read_csv(file)
    time_columns = [col for col in df.columns if col not in non_time_columns]
    
    for _, row in df.iterrows():
        trains_rows.append({
            'train_no': row['train_no'],
            'train_name': row['train_name'],
            'train_type': row['train_type'],
            'route_via': row['route_via'],
            'direction': row['direction'],
            'distance_km': row['distance_km']
        })
        
        stop_seq = 1
        for col in time_columns:
            value = row[col]
            if pd.isna(value) or str(value).strip() == '':
                continue
            
            code = (col.replace('station_', '')
                       .replace('_time', '')
                       .replace('origin_dep_', '')
                       .replace('dest_arr_', '')
                       .upper())
            station_codes.add(code)
            
            stops_rows.append({
                'train_no': row['train_no'],
                'station_code': code,
                'arrival_time': value,
                'departure_time': value,
                'stop_sequence': stop_seq
            })
            stop_seq += 1

trains_df = pd.DataFrame(trains_rows).drop_duplicates(subset='train_no')
stops_df = pd.DataFrame(stops_rows)
stations_df = pd.DataFrame({'station_code': sorted(station_codes), 'station_name': ''})

trains_df.to_csv('trains_import.csv', index=False)
stops_df.to_csv('train_stops_import.csv', index=False)
stations_df.to_csv('stations_import.csv', index=False)

print(f"trains: {len(trains_df)} rows")
print(f"stations: {len(stations_df)} rows")
print(f"train_stops: {len(stops_df)} rows")