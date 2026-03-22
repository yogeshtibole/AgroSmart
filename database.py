import psycopg2
import os

def get_connection():
    url = os.environ.get('DATABASE_URL')
    if url:
        return psycopg2.connect(url)
    # fallback for local development
    return psycopg2.connect(
        dbname='agrosmart',
        user='postgres',
        password='yogesh2005',
        host='localhost',
        port='5432'
    )
