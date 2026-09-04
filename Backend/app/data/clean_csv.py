import pandas as pd
from pathlib import Path

files = ['ratlam_indore.csv', 'indore_ratlam.csv']

non_time_columns = {
    'train_no',
    'train_name',
    'train_type',
    'route_via',
    'direction',
    'distance_km'
}


def normalize_time(value):
    # Handle missing values
    if pd.isna(value):
        return ''

    value = str(value).strip()

    if value in ('', '-', '--'):
        return ''

    # Try common time formats
    formats = [
        '%I:%M:%S %p',  # 09:30:00 PM
        '%I:%M %p',     # 09:30 PM
        '%H:%M:%S',     # 21:30:00
        '%H:%M',        # 21:30
    ]

    for fmt in formats:
        try:
            parsed = pd.to_datetime(value, format=fmt)
            return parsed.strftime('%H:%M:%S')
        except (ValueError, TypeError):
            pass

    # If the value cannot be interpreted as a time
    return ''


for file in files:
    try:
        print(f"\nProcessing: {file}")

        # Try multiple encodings
        df = None

        for encoding in ['utf-8', 'cp1252', 'latin1']:
            try:
                df = pd.read_csv(file, encoding=encoding)
                print(f"Successfully read using {encoding}")
                break
            except UnicodeDecodeError:
                continue

        if df is None:
            print(f"Could not decode {file}")
            continue

        # Normalize column names for comparison
        df.columns = df.columns.str.strip()

        # Find time columns
        time_columns = [
            col for col in df.columns
            if col.strip().lower() not in non_time_columns
        ]

        print(f"Time columns found: {time_columns}")

        # Process time columns
        for col in time_columns:
            df[col] = df[col].apply(normalize_time)

        # Create output filename
        output_name = Path(file).stem + '_cleaned.csv'

        # Save
        df.to_csv(
            output_name,
            index=False,
            encoding='utf-8'
        )

        print(f"Done! {output_name} created.")

    except FileNotFoundError:
        print(f"ERROR: File not found: {file}")

    except Exception as e:
        print(f"ERROR processing {file}: {type(e).__name__}: {e}")