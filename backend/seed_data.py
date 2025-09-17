import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    host=os.getenv('POSTGRES_HOST'),
    port=os.getenv('POSTGRES_PORT')
)
cur = conn.cursor()

# Sample seeds (adjust tables/columns to your schema)
cur.execute("""
    INSERT INTO zones (name, description) VALUES ('Zone1', 'Demo zone') ON CONFLICT DO NOTHING;
    INSERT INTO hotels (name, zone_id) VALUES ('Hotel A', 1) ON CONFLICT DO NOTHING;
    INSERT INTO police_units (name, zone_id) VALUES ('Unit 1', 1) ON CONFLICT DO NOTHING;
    INSERT INTO digital_ids (user_id, id_number) VALUES (1, 'DEMO123') ON CONFLICT DO NOTHING;
""")

conn.commit()
cur.close()
conn.close()

print("Sample data seeded.")