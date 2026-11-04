import requests

url = "http://127.0.0.1:8000/schemes/match"
payload = {
    "profile": {
        "name": "Test",
        "age": 25,
        "gender": "male",
        "state": "Delhi",
        "occupation": "Farmer",
        "income": 10000,
        "category": "General",
        "land_owner": True,
        "student_status": False,
        "family_size": 4
    }
}
response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")
try:
    print(response.json())
except:
    print(response.text)
