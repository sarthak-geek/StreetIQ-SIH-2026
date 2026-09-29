from flask import Flask, request, jsonify
from flask_cors import CORS

import psycopg
import json


# ============================================================
# FLASK SETUP
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# POSTGRESQL DATABASE DETAILS
# ============================================================

DB_HOST = "localhost"
DB_NAME = "Street_IQ"
DB_USER = "postgres"
DB_PASSWORD = "272006"
DB_PORT = 5432


# ============================================================
# DATABASE TABLE DETAILS
# ============================================================

TABLE_NAME = "road_segments"
SEGMENT_ID_COLUMN = "segment_id"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_database_connection():

    connection = psycopg.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )

    return connection


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return "StreetIQ Flask backend is running"


# ============================================================
# SEGMENT API
# ============================================================

@app.route("/segment", methods=["POST"])
def segment_data():

    # --------------------------------------------------------
    # RECEIVE SEGMENT ID FROM REACT
    # --------------------------------------------------------

    data = request.get_json()

    segment_id = data.get("segment_id")

    print()
    print("========================================")
    print("Received segment ID:", segment_id)
    print("========================================")


    # --------------------------------------------------------
    # CHECK WHETHER SEGMENT ID WAS PROVIDED
    # --------------------------------------------------------

    if not segment_id:

        return jsonify({
            "error": "No segment ID received"
        }), 400


    connection = None

    try:

        # ----------------------------------------------------
        # CONNECT TO POSTGRESQL
        # ----------------------------------------------------

        connection = get_database_connection()

        print("Connected to PostgreSQL")


        # ----------------------------------------------------
        # CREATE CURSOR
        # ----------------------------------------------------

        cursor = connection.cursor()


        # ----------------------------------------------------
        # SQL QUERY
        # ----------------------------------------------------

        query = f"""
            SELECT road_condition
            FROM {TABLE_NAME}
            WHERE {SEGMENT_ID_COLUMN} = %s
        """


        # ----------------------------------------------------
        # EXECUTE QUERY
        # ----------------------------------------------------

        cursor.execute(
            query,
            (segment_id,)
        )


        # ----------------------------------------------------
        # FETCH MATCHING ROW
        # ----------------------------------------------------

        row = cursor.fetchone()


        # ----------------------------------------------------
        # NO MATCH FOUND
        # ----------------------------------------------------

        if row is None:

            print("No matching segment found")

            cursor.close()

            return jsonify({
                "error": "Segment not found"
            }), 404


        # ----------------------------------------------------
        # GET ROAD CONDITION JSON
        # ----------------------------------------------------

        road_condition_data = row[0]


        # ----------------------------------------------------
        # PRINT DATA IN TERMINAL
        # ----------------------------------------------------

        print()
        print("========== ROAD CONDITION ==========")
        print(road_condition_data)
        print("====================================")
        print()


        # ----------------------------------------------------
        # CLOSE CURSOR
        # ----------------------------------------------------

        cursor.close()


        # ----------------------------------------------------
        # RETURN ONLY JSON DATA TO REACT
        # ----------------------------------------------------

        return jsonify(road_condition_data)


    except Exception as error:

        print()
        print("========== DATABASE ERROR ==========")
        print(error)
        print("====================================")
        print()


        return jsonify({
            "error": str(error)
        }), 500


    finally:

        # ----------------------------------------------------
        # CLOSE DATABASE CONNECTION
        # ----------------------------------------------------

        if connection is not None:

            connection.close()

            print("PostgreSQL connection closed")

            

@app.route('/database-operation', methods=['POST'])
def database_operation():

    connection = None
    cursor = None

    try:

        # ----------------------------------------------------
        # SQL FILE PATH
        # ----------------------------------------------------


        # ----------------------------------------------------
        # READ SQL FILE
        # ----------------------------------------------------

        with open(
            r"C:\SARTHAK\SIH\Database\updating_segment_data.sql",
            "r",
            encoding="utf-8"
        ) as sql_file:

            sql_script = sql_file.read()


        # ----------------------------------------------------
        # CONNECT TO POSTGRESQL
        # ----------------------------------------------------

        connection = get_database_connection()

        print("Connected to PostgreSQL")


        # ----------------------------------------------------
        # CREATE CURSOR
        # ----------------------------------------------------

        cursor = connection.cursor()


        # ----------------------------------------------------
        # EXECUTE SQL FILE
        # ----------------------------------------------------

        cursor.execute(sql_script)


        # ----------------------------------------------------
        # COMMIT CHANGES
        # ----------------------------------------------------

        connection.commit()

        print("SQL file executed successfully")


        # ----------------------------------------------------
        # CLOSE CURSOR
        # ----------------------------------------------------

        cursor.close()


        # ----------------------------------------------------
        # RETURN NOTHING TO REACT
        # ----------------------------------------------------

        return '', 204


    except Exception as error:

        print()
        print("========== DATABASE OPERATION ERROR ==========")
        print(error)
        print("==============================================")
        print()


        # ----------------------------------------------------
        # ROLLBACK IF SOMETHING FAILED
        # ----------------------------------------------------

        if connection is not None:
            connection.rollback()


        return jsonify({
            "error": str(error)
        }), 500


    finally:

        # ----------------------------------------------------
        # CLOSE DATABASE CONNECTION
        # ----------------------------------------------------

        if connection is not None:

            connection.close()

            print("PostgreSQL connection closed")


# ============================================================
# START FLASK
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )