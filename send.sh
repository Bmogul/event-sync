curl -X POST \
  http://localhost:3000/api/B37DA2389S/remindeCountDown \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "sheetID": "1nN5uQ6-NUT6fS4n8Bz7v4f4X3Be1QtVnTWRVOsC_5z4",
      "eventID": "B37DA2389S",
      "eventTitle": "Rashida Weds Ibrahim",
      "eventDate": "6:30 PM, 28th November 2024, Thursday",
      "numberOfFunctions": 1,
      "email_message": "",
      "logo": "https://i.imgur.com/gtm1VCd.png",
      "func0": {
        "funcNum": 0,
        "funcTitle": "Khushi Jaman and Darees",
        "cardLink": "https://i.imgur.com/Uo5EF2A.jpeg",
        "date": "6:30 PM, 28th November 2024, Thursday",
        "location": "17730 Coventry Park Dr, Houston, TX 77084"
      }
    }
}'
