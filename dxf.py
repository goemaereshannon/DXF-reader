# import os
# import tempfile
# from flask import Flask, request, jsonify
# import ezdxf

# app = Flask(__name__)

# @app.route('/parse-dxf', methods=['POST'])
# def parse_dxf():
#     try:
#         uploaded_file = request.files['file']
#         if not uploaded_file:
#             return jsonify({'error': 'No file uploaded'}), 400

#         with tempfile.NamedTemporaryFile(delete=False, suffix=".dxf") as tmp:
#             uploaded_file.save(tmp.name)
#             tmp_path = tmp.name  # Save path before the context ends

#         # Open via ezdxf *after* file has been closed by the with-block
#         doc = ezdxf.readfile(tmp_path)
#         msp = doc.modelspace()

#         lines = []
#         for e in msp.query('LINE'):
#             lines.append({
#                 'start': {'x': e.dxf.start.x, 'y': e.dxf.start.y},
#                 'end': {'x': e.dxf.end.x, 'y': e.dxf.end.y},
#                 'color': e.rgb or 'blue',
#                 'layer': e.dxf.layer
#             })

#         return jsonify({'lines': lines})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

#     finally:
#         try:
#             os.unlink(tmp_path)
#         except Exception as cleanup_err:
#             print("Failed to delete temp file:", cleanup_err)

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
import os
import tempfile
from flask import Flask, request, jsonify
import ezdxf

app = Flask(__name__)

def extract_entities(doc):
    result = []

    # Loop door alle entiteiten in het modelspace van het DXF-bestand
    for e in doc.modelspace():
        if e.dxftype() == 'LINE':
            result.append({
                'type': 'LINE',
                'start': {'x': e.dxf.start.x, 'y': e.dxf.start.y},
                'end': {'x': e.dxf.end.x, 'y': e.dxf.end.y},
                'layer': e.dxf.layer
            })

        elif e.dxftype() == 'LWPOLYLINE':
            points = [{'x': p[0], 'y': p[1]} for p in e.get_points()]
            result.append({
                'type': 'LWPOLYLINE',
                'points': points,
                'layer': e.dxf.layer
            })

        elif e.dxftype() == 'CIRCLE':
            result.append({
                'type': 'CIRCLE',
                'center': {'x': e.dxf.center.x, 'y': e.dxf.center.y},
                'radius': e.dxf.radius,
                'layer': e.dxf.layer
            })

        elif e.dxftype() == 'ARC':
            result.append({
                'type': 'ARC',
                'center': {'x': e.dxf.center.x, 'y': e.dxf.center.y},
                'radius': e.dxf.radius,
                'start_angle': e.dxf.start_angle,
                'end_angle': e.dxf.end_angle,
                'layer': e.dxf.layer
            })

        elif e.dxftype() == 'INSERT':
            block_name = e.dxf.name
            result.append({
                'type': 'INSERT',
                'block_name': block_name,
                'location': {'x': e.dxf.insert.x, 'y': e.dxf.insert.y},
                'layer': e.dxf.layer
            })

    return result

@app.route('/parse-dxf', methods=['POST'])
def parse_dxf():
    try:
        uploaded_file = request.files['file']
        if not uploaded_file:
            return jsonify({'error': 'No file uploaded'}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix=".dxf") as tmp:
            uploaded_file.save(tmp.name)
            tmp_path = tmp.name  # Save path before the context ends

        # Open via ezdxf *after* file has been closed by the with-block
        doc = ezdxf.readfile(tmp_path)

        # Haal de entiteiten uit het document
        entities = extract_entities(doc)

        # Retourneer alle gevonden entiteiten als JSON
        return jsonify({'entities': entities})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        try:
            os.unlink(tmp_path)
        except Exception as cleanup_err:
            print("Failed to delete temp file:", cleanup_err)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
