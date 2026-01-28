from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class Destination(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    state: str
    description: str
    short_description: str
    image_url: str
    latitude: float
    longitude: float
    best_time_to_visit: str
    popular_for: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Hotel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination_id: str
    name: str
    description: str
    image_url: str
    rating: float
    price_per_night: int
    amenities: List[str]
    address: str
    latitude: float
    longitude: float

class Attraction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination_id: str
    name: str
    description: str
    image_url: str
    category: str  # temple, monument, nature, etc.
    entry_fee: int
    timings: str
    latitude: float
    longitude: float

class ShoppingMall(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination_id: str
    name: str
    description: str
    image_url: str
    address: str
    timings: str
    latitude: float
    longitude: float

class Transport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination_id: str
    type: str  # train, bus, flight, local
    name: str
    description: str
    from_location: str
    to_location: str
    duration: str
    price_range: str
    frequency: str

class SearchQuery(BaseModel):
    query: str

class AIDescriptionRequest(BaseModel):
    destination_name: str
    topic: str  # overview, culture, food, tips

# ============== SEED DATA ==============

DESTINATIONS_DATA = [
    {
        "id": "delhi",
        "name": "Delhi",
        "state": "Delhi",
        "description": "Delhi, India's capital territory, is a massive metropolitan area in the country's north. In Old Delhi, a neighborhood dating to the 1600s, stands the imposing Mughal-era Red Fort, a symbol of India, and the sprawling Jama Masjid mosque, whose courtyard accommodates 25,000 people.",
        "short_description": "India's historic capital with Mughal heritage",
        "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "best_time_to_visit": "October to March",
        "popular_for": ["History", "Street Food", "Shopping", "Monuments"]
    },
    {
        "id": "jaipur",
        "name": "Jaipur",
        "state": "Rajasthan",
        "description": "Jaipur is the capital of India's Rajasthan state. It evokes the royal family that once ruled the region and that, in 1727, founded what is now called the Old City, or 'Pink City' for its signature building color. At the center of its stately street grid stands the opulent, colonnaded City Palace complex.",
        "short_description": "The Pink City with royal palaces",
        "image_url": "https://images.unsplash.com/photo-1618128587777-c472aa97d836?auto=format&fit=crop&q=80",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "best_time_to_visit": "November to February",
        "popular_for": ["Palaces", "Forts", "Handicrafts", "Culture"]
    },
    {
        "id": "goa",
        "name": "Goa",
        "state": "Goa",
        "description": "Goa is a state in western India with coastlines stretching along the Arabian Sea. Its long history as a Portuguese colony prior to 1961 is evident in its preserved 17th-century churches and the area's tropical spice plantations. Goa is also known for its beaches.",
        "short_description": "Beach paradise with Portuguese heritage",
        "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80",
        "latitude": 15.2993,
        "longitude": 74.1240,
        "best_time_to_visit": "November to February",
        "popular_for": ["Beaches", "Nightlife", "Water Sports", "Churches"]
    },
    {
        "id": "kerala",
        "name": "Kerala",
        "state": "Kerala",
        "description": "Kerala, a state on India's tropical Malabar Coast, has nearly 600km of Arabian Sea shoreline. It's known for its palm-lined beaches and backwaters, a network of canals. Inland are the Western Ghats, mountains whose high-elevation plantations produce tea, coffee and spices.",
        "short_description": "God's Own Country with backwaters",
        "image_url": "https://images.unsplash.com/photo-1707893013488-51672ef83425?auto=format&fit=crop&q=80",
        "latitude": 10.8505,
        "longitude": 76.2711,
        "best_time_to_visit": "September to March",
        "popular_for": ["Backwaters", "Ayurveda", "Tea Gardens", "Wildlife"]
    },
    {
        "id": "agra",
        "name": "Agra",
        "state": "Uttar Pradesh",
        "description": "Agra is a city on the banks of the Yamuna river in the Indian state of Uttar Pradesh. It is home to the iconic Taj Mahal, built by Mughal emperor Shah Jahan as a mausoleum for his wife Mumtaz Mahal. The monument is a UNESCO World Heritage Site.",
        "short_description": "Home of the magnificent Taj Mahal",
        "image_url": "https://images.unsplash.com/photo-1732308988547-bfbcf9171f69?auto=format&fit=crop&q=80",
        "latitude": 27.1767,
        "longitude": 78.0081,
        "best_time_to_visit": "October to March",
        "popular_for": ["Taj Mahal", "Agra Fort", "Mughal Architecture", "Handicrafts"]
    },
    {
        "id": "varanasi",
        "name": "Varanasi",
        "state": "Uttar Pradesh",
        "description": "Varanasi is a city in the northern Indian state of Uttar Pradesh dating to the 11th century B.C. Regarded as the spiritual capital of India, the city draws Hindu pilgrims who bathe in the Ganges River's sacred waters and perform funeral rites.",
        "short_description": "India's spiritual capital on the Ganges",
        "image_url": "https://images.unsplash.com/photo-1757308530438-4e2340a6475f?auto=format&fit=crop&q=80",
        "latitude": 25.3176,
        "longitude": 82.9739,
        "best_time_to_visit": "October to March",
        "popular_for": ["Ghats", "Temples", "Spirituality", "Silk Weaving"]
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "description": "Mumbai is the financial capital of India and the most populous city. It's home to the Bollywood film industry and features Victorian-era architecture, including the Gateway of India, alongside modern skyscrapers and beautiful coastline.",
        "short_description": "The City of Dreams and Bollywood",
        "image_url": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "best_time_to_visit": "November to February",
        "popular_for": ["Gateway of India", "Bollywood", "Street Food", "Marine Drive"]
    },
    {
        "id": "udaipur",
        "name": "Udaipur",
        "state": "Rajasthan",
        "description": "Udaipur, formerly the capital of the Mewar Kingdom, is a city in the western Indian state of Rajasthan. Founded by Maharana Udai Singh II in 1559, it's set around a series of artificial lakes and is known for its lavish royal residences.",
        "short_description": "City of Lakes with romantic palaces",
        "image_url": "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&q=80",
        "latitude": 24.5854,
        "longitude": 73.7125,
        "best_time_to_visit": "September to March",
        "popular_for": ["Lake Palace", "City Palace", "Boating", "Heritage Hotels"]
    }
]

HOTELS_DATA = {
    "delhi": [
        {"name": "The Imperial", "description": "Luxury heritage hotel with colonial charm", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80", "rating": 4.8, "price_per_night": 15000, "amenities": ["Spa", "Pool", "Fine Dining", "WiFi"], "address": "Janpath, New Delhi", "latitude": 28.6280, "longitude": 77.2199},
        {"name": "The Oberoi", "description": "World-class luxury with impeccable service", "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 20000, "amenities": ["Spa", "Pool", "Gym", "Butler Service"], "address": "Dr Zakir Hussain Marg, New Delhi", "latitude": 28.5960, "longitude": 77.2465},
        {"name": "Hotel City Star", "description": "Budget-friendly hotel in central Delhi", "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80", "rating": 3.8, "price_per_night": 2500, "amenities": ["WiFi", "AC", "Restaurant"], "address": "Paharganj, New Delhi", "latitude": 28.6448, "longitude": 77.2116}
    ],
    "jaipur": [
        {"name": "Rambagh Palace", "description": "Former royal residence turned luxury hotel", "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 35000, "amenities": ["Spa", "Pool", "Heritage Tour", "Royal Dining"], "address": "Bhawani Singh Road, Jaipur", "latitude": 26.8945, "longitude": 75.8065},
        {"name": "ITC Rajputana", "description": "Premium hotel with Rajasthani hospitality", "image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80", "rating": 4.5, "price_per_night": 8000, "amenities": ["Spa", "Pool", "Business Center", "Multiple Restaurants"], "address": "Palace Road, Jaipur", "latitude": 26.9100, "longitude": 75.7850},
        {"name": "Hotel Pearl Palace", "description": "Charming budget hotel with rooftop restaurant", "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80", "rating": 4.2, "price_per_night": 1800, "amenities": ["Rooftop Cafe", "WiFi", "AC"], "address": "Hathroi Fort, Jaipur", "latitude": 26.9200, "longitude": 75.8100}
    ],
    "goa": [
        {"name": "Taj Exotica", "description": "Beachfront luxury resort", "image_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80", "rating": 4.8, "price_per_night": 18000, "amenities": ["Private Beach", "Spa", "Pool", "Water Sports"], "address": "Benaulim Beach, South Goa", "latitude": 15.2557, "longitude": 73.9386},
        {"name": "W Goa", "description": "Trendy beachside resort with modern amenities", "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80", "rating": 4.6, "price_per_night": 22000, "amenities": ["Beach Access", "Nightclub", "Infinity Pool", "Spa"], "address": "Vagator Beach, North Goa", "latitude": 15.5972, "longitude": 73.7371},
        {"name": "Zostel Goa", "description": "Popular backpacker hostel", "image_url": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80", "rating": 4.0, "price_per_night": 600, "amenities": ["Common Area", "WiFi", "Tours"], "address": "Anjuna, North Goa", "latitude": 15.5738, "longitude": 73.7419}
    ],
    "kerala": [
        {"name": "Kumarakom Lake Resort", "description": "Luxury houseboat experience", "image_url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80", "rating": 4.7, "price_per_night": 25000, "amenities": ["Houseboat", "Ayurvedic Spa", "Pool", "Backwater Cruise"], "address": "Kumarakom, Kerala", "latitude": 9.6019, "longitude": 76.4304},
        {"name": "Taj Malabar Resort", "description": "Heritage waterfront hotel", "image_url": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80", "rating": 4.6, "price_per_night": 12000, "amenities": ["Harbor View", "Spa", "Pool", "Heritage Tour"], "address": "Willingdon Island, Kochi", "latitude": 9.9633, "longitude": 76.2670},
        {"name": "Treebo Aswathi", "description": "Comfortable budget stay", "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80", "rating": 3.9, "price_per_night": 2000, "amenities": ["WiFi", "AC", "Restaurant"], "address": "MG Road, Kochi", "latitude": 9.9716, "longitude": 76.2846}
    ],
    "agra": [
        {"name": "The Oberoi Amarvilas", "description": "Luxury hotel with Taj Mahal views", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 45000, "amenities": ["Taj View", "Spa", "Pool", "Fine Dining"], "address": "Taj East Gate Road, Agra", "latitude": 27.1714, "longitude": 78.0421},
        {"name": "ITC Mughal", "description": "Mughal-inspired luxury resort", "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80", "rating": 4.5, "price_per_night": 10000, "amenities": ["Spa", "Pool", "Golf Course", "Gardens"], "address": "Fatehabad Road, Agra", "latitude": 27.1581, "longitude": 78.0281},
        {"name": "Hotel Sidhartha", "description": "Budget hotel near Taj Mahal", "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80", "rating": 3.6, "price_per_night": 1500, "amenities": ["WiFi", "AC", "Restaurant"], "address": "Western Gate, Agra", "latitude": 27.1750, "longitude": 78.0200}
    ],
    "varanasi": [
        {"name": "Taj Ganges", "description": "Premium hotel with serene ambiance", "image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80", "rating": 4.5, "price_per_night": 8000, "amenities": ["Spa", "Pool", "Yoga", "Ghat Tours"], "address": "Nadesar Palace Grounds, Varanasi", "latitude": 25.3108, "longitude": 83.0085},
        {"name": "BrijRama Palace", "description": "Heritage palace on the ghats", "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80", "rating": 4.7, "price_per_night": 15000, "amenities": ["Ghat View", "Heritage Tour", "Spa", "River Cruise"], "address": "Darbhanga Ghat, Varanasi", "latitude": 25.3042, "longitude": 83.0133},
        {"name": "Zostel Varanasi", "description": "Riverside backpacker hostel", "image_url": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80", "rating": 4.1, "price_per_night": 500, "amenities": ["Ghat View", "Common Area", "Tours"], "address": "Assi Ghat, Varanasi", "latitude": 25.2876, "longitude": 83.0072}
    ],
    "mumbai": [
        {"name": "Taj Mahal Palace", "description": "Iconic heritage hotel at Gateway of India", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 25000, "amenities": ["Sea View", "Spa", "Pool", "Multiple Restaurants"], "address": "Apollo Bunder, Mumbai", "latitude": 18.9217, "longitude": 72.8332},
        {"name": "The Oberoi Mumbai", "description": "Luxury hotel with ocean views", "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80", "rating": 4.8, "price_per_night": 18000, "amenities": ["Ocean View", "Spa", "Pool", "Fine Dining"], "address": "Nariman Point, Mumbai", "latitude": 18.9244, "longitude": 72.8202},
        {"name": "Hotel Kemps Corner", "description": "Mid-range hotel in South Mumbai", "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80", "rating": 3.8, "price_per_night": 4000, "amenities": ["WiFi", "AC", "Restaurant"], "address": "Kemps Corner, Mumbai", "latitude": 18.9620, "longitude": 72.8110}
    ],
    "udaipur": [
        {"name": "Taj Lake Palace", "description": "Floating palace on Lake Pichola", "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 50000, "amenities": ["Lake View", "Spa", "Pool", "Royal Dining"], "address": "Lake Pichola, Udaipur", "latitude": 24.5750, "longitude": 73.6800},
        {"name": "The Oberoi Udaivilas", "description": "Ultra-luxury resort with lake views", "image_url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80", "rating": 4.9, "price_per_night": 55000, "amenities": ["Lake View", "Spa", "Private Pool", "Butler Service"], "address": "Haridasji Ki Magri, Udaipur", "latitude": 24.5650, "longitude": 73.6750},
        {"name": "Hotel Lakend", "description": "Budget-friendly with lake proximity", "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80", "rating": 3.7, "price_per_night": 2500, "amenities": ["Pool", "WiFi", "Restaurant"], "address": "Fateh Sagar Lake, Udaipur", "latitude": 24.6050, "longitude": 73.6850}
    ]
}

ATTRACTIONS_DATA = {
    "delhi": [
        {"name": "Red Fort", "description": "UNESCO World Heritage Site, Mughal architecture masterpiece", "image_url": "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 35, "timings": "9:30 AM - 4:30 PM", "latitude": 28.6562, "longitude": 77.2410},
        {"name": "India Gate", "description": "War memorial dedicated to Indian soldiers", "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 0, "timings": "24 Hours", "latitude": 28.6129, "longitude": 77.2295},
        {"name": "Qutub Minar", "description": "73-meter tall minaret, UNESCO World Heritage Site", "image_url": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 35, "timings": "7:00 AM - 5:00 PM", "latitude": 28.5245, "longitude": 77.1855},
        {"name": "Lotus Temple", "description": "Bahá'í House of Worship known for lotus-shaped architecture", "image_url": "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&q=80", "category": "Temple", "entry_fee": 0, "timings": "9:00 AM - 5:30 PM", "latitude": 28.5535, "longitude": 77.2588}
    ],
    "jaipur": [
        {"name": "Hawa Mahal", "description": "Palace of Winds with 953 windows", "image_url": "https://images.unsplash.com/photo-1618128587777-c472aa97d836?auto=format&fit=crop&q=80", "category": "Palace", "entry_fee": 50, "timings": "9:00 AM - 5:00 PM", "latitude": 26.9239, "longitude": 75.8267},
        {"name": "Amber Fort", "description": "Magnificent hilltop fort with Sheesh Mahal", "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80", "category": "Fort", "entry_fee": 200, "timings": "8:00 AM - 5:30 PM", "latitude": 26.9855, "longitude": 75.8513},
        {"name": "City Palace", "description": "Royal residence with museums and courtyards", "image_url": "https://images.unsplash.com/photo-1574236170878-f66e35f83207?auto=format&fit=crop&q=80", "category": "Palace", "entry_fee": 300, "timings": "9:30 AM - 5:00 PM", "latitude": 26.9258, "longitude": 75.8237},
        {"name": "Jantar Mantar", "description": "UNESCO-listed astronomical observation site", "image_url": "https://images.unsplash.com/photo-1590766940554-634c4e5bf8a1?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 50, "timings": "9:00 AM - 4:30 PM", "latitude": 26.9248, "longitude": 75.8244}
    ],
    "goa": [
        {"name": "Basilica of Bom Jesus", "description": "UNESCO World Heritage church with St. Francis Xavier's remains", "image_url": "https://images.unsplash.com/photo-1582972236019-ea4af5edd73f?auto=format&fit=crop&q=80", "category": "Church", "entry_fee": 0, "timings": "9:00 AM - 6:30 PM", "latitude": 15.5009, "longitude": 73.9116},
        {"name": "Fort Aguada", "description": "17th-century Portuguese fort overlooking the sea", "image_url": "https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&q=80", "category": "Fort", "entry_fee": 0, "timings": "9:30 AM - 6:00 PM", "latitude": 15.4939, "longitude": 73.7731},
        {"name": "Dudhsagar Falls", "description": "Four-tiered waterfall on the Mandovi River", "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80", "category": "Nature", "entry_fee": 50, "timings": "8:00 AM - 5:00 PM", "latitude": 15.3144, "longitude": 74.3143},
        {"name": "Calangute Beach", "description": "Popular beach known as Queen of Beaches", "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80", "category": "Beach", "entry_fee": 0, "timings": "24 Hours", "latitude": 15.5449, "longitude": 73.7553}
    ],
    "kerala": [
        {"name": "Alleppey Backwaters", "description": "Famous houseboat cruises through palm-fringed canals", "image_url": "https://images.unsplash.com/photo-1707893013488-51672ef83425?auto=format&fit=crop&q=80", "category": "Nature", "entry_fee": 0, "timings": "6:00 AM - 6:00 PM", "latitude": 9.4981, "longitude": 76.3388},
        {"name": "Munnar Tea Gardens", "description": "Rolling hills covered with tea plantations", "image_url": "https://images.unsplash.com/photo-1605889083106-4c3c54ff4c57?auto=format&fit=crop&q=80", "category": "Nature", "entry_fee": 0, "timings": "8:00 AM - 6:00 PM", "latitude": 10.0889, "longitude": 77.0595},
        {"name": "Periyar Wildlife Sanctuary", "description": "Tiger reserve with elephant herds", "image_url": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&q=80", "category": "Wildlife", "entry_fee": 45, "timings": "6:00 AM - 6:00 PM", "latitude": 9.4680, "longitude": 77.1615},
        {"name": "Kovalam Beach", "description": "Crescent-shaped beach with lighthouse views", "image_url": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80", "category": "Beach", "entry_fee": 0, "timings": "24 Hours", "latitude": 8.4004, "longitude": 76.9787}
    ],
    "agra": [
        {"name": "Taj Mahal", "description": "Iconic marble mausoleum, one of the Seven Wonders", "image_url": "https://images.unsplash.com/photo-1732308988547-bfbcf9171f69?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 50, "timings": "6:00 AM - 6:30 PM", "latitude": 27.1751, "longitude": 78.0421},
        {"name": "Agra Fort", "description": "UNESCO World Heritage Mughal fortress", "image_url": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80", "category": "Fort", "entry_fee": 35, "timings": "6:00 AM - 6:00 PM", "latitude": 27.1795, "longitude": 78.0211},
        {"name": "Fatehpur Sikri", "description": "Abandoned Mughal city with stunning architecture", "image_url": "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 50, "timings": "6:00 AM - 6:00 PM", "latitude": 27.0945, "longitude": 77.6679},
        {"name": "Mehtab Bagh", "description": "Garden complex with Taj Mahal views across Yamuna", "image_url": "https://images.unsplash.com/photo-1742109536522-2882cdb07198?auto=format&fit=crop&q=80", "category": "Garden", "entry_fee": 25, "timings": "6:00 AM - 6:00 PM", "latitude": 27.1821, "longitude": 78.0416}
    ],
    "varanasi": [
        {"name": "Dashashwamedh Ghat", "description": "Main ghat famous for evening Ganga Aarti", "image_url": "https://images.unsplash.com/photo-1757308530438-4e2340a6475f?auto=format&fit=crop&q=80", "category": "Ghat", "entry_fee": 0, "timings": "24 Hours", "latitude": 25.3109, "longitude": 83.0107},
        {"name": "Kashi Vishwanath Temple", "description": "One of the 12 Jyotirlingas dedicated to Lord Shiva", "image_url": "https://images.unsplash.com/photo-1604013300190-c6f4b7c30889?auto=format&fit=crop&q=80", "category": "Temple", "entry_fee": 0, "timings": "4:00 AM - 11:00 PM", "latitude": 25.3109, "longitude": 83.0107},
        {"name": "Sarnath", "description": "Buddhist pilgrimage site where Buddha gave first sermon", "image_url": "https://images.unsplash.com/photo-1624461960923-e570f2fcdb82?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 25, "timings": "9:00 AM - 5:00 PM", "latitude": 25.3813, "longitude": 83.0227},
        {"name": "Assi Ghat", "description": "Serene ghat popular with tourists and yoga practitioners", "image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80", "category": "Ghat", "entry_fee": 0, "timings": "24 Hours", "latitude": 25.2876, "longitude": 83.0072}
    ],
    "mumbai": [
        {"name": "Gateway of India", "description": "Iconic arch monument overlooking the Arabian Sea", "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 0, "timings": "24 Hours", "latitude": 18.9220, "longitude": 72.8347},
        {"name": "Elephanta Caves", "description": "UNESCO World Heritage rock-cut cave temples", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "category": "Monument", "entry_fee": 40, "timings": "9:30 AM - 5:00 PM", "latitude": 18.9633, "longitude": 72.9315},
        {"name": "Marine Drive", "description": "3.6 km promenade along the coast, Queen's Necklace", "image_url": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&q=80", "category": "Promenade", "entry_fee": 0, "timings": "24 Hours", "latitude": 18.9435, "longitude": 72.8232},
        {"name": "Siddhivinayak Temple", "description": "Famous Ganesh temple visited by celebrities", "image_url": "https://images.unsplash.com/photo-1604013300190-c6f4b7c30889?auto=format&fit=crop&q=80", "category": "Temple", "entry_fee": 0, "timings": "5:30 AM - 10:00 PM", "latitude": 19.0167, "longitude": 72.8303}
    ],
    "udaipur": [
        {"name": "City Palace", "description": "Largest palace complex in Rajasthan on Lake Pichola", "image_url": "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&q=80", "category": "Palace", "entry_fee": 300, "timings": "9:30 AM - 5:30 PM", "latitude": 24.5764, "longitude": 73.6832},
        {"name": "Lake Pichola", "description": "Artificial freshwater lake with island palaces", "image_url": "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&q=80", "category": "Lake", "entry_fee": 400, "timings": "8:00 AM - 6:00 PM", "latitude": 24.5725, "longitude": 73.6780},
        {"name": "Jagdish Temple", "description": "Indo-Aryan temple dedicated to Lord Vishnu", "image_url": "https://images.unsplash.com/photo-1604013300190-c6f4b7c30889?auto=format&fit=crop&q=80", "category": "Temple", "entry_fee": 0, "timings": "5:00 AM - 2:00 PM, 4:00 PM - 10:00 PM", "latitude": 24.5783, "longitude": 73.6835},
        {"name": "Saheliyon Ki Bari", "description": "Garden of Maidens with fountains and lotus pools", "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80", "category": "Garden", "entry_fee": 30, "timings": "8:00 AM - 7:00 PM", "latitude": 24.5941, "longitude": 73.6890}
    ]
}

SHOPPING_DATA = {
    "delhi": [
        {"name": "Chandni Chowk", "description": "Historic market with street food and textiles", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Old Delhi", "timings": "10:00 AM - 8:00 PM", "latitude": 28.6507, "longitude": 77.2334},
        {"name": "Select Citywalk", "description": "Premium mall with international brands", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Saket, New Delhi", "timings": "10:00 AM - 10:00 PM", "latitude": 28.5285, "longitude": 77.2192},
        {"name": "Dilli Haat", "description": "Open-air craft bazaar with food from all states", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "INA, New Delhi", "timings": "10:30 AM - 10:00 PM", "latitude": 28.5731, "longitude": 77.2090}
    ],
    "jaipur": [
        {"name": "Johari Bazaar", "description": "Famous for jewelry, gemstones, and textiles", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Pink City, Jaipur", "timings": "10:00 AM - 8:00 PM", "latitude": 26.9229, "longitude": 75.8249},
        {"name": "World Trade Park", "description": "Modern mall with entertainment options", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Malviya Nagar, Jaipur", "timings": "10:00 AM - 10:00 PM", "latitude": 26.8520, "longitude": 75.8030},
        {"name": "Bapu Bazaar", "description": "Traditional market for Rajasthani textiles and crafts", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Near Sanganer Gate, Jaipur", "timings": "10:00 AM - 8:00 PM", "latitude": 26.9170, "longitude": 75.8200}
    ],
    "goa": [
        {"name": "Anjuna Flea Market", "description": "Famous Wednesday market with bohemian vibes", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Anjuna Beach, North Goa", "timings": "8:00 AM - 6:00 PM (Wed only)", "latitude": 15.5738, "longitude": 73.7419},
        {"name": "Mapusa Market", "description": "Local market with Goan spices and cashews", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Mapusa, North Goa", "timings": "8:00 AM - 7:00 PM (Fri special)", "latitude": 15.5937, "longitude": 73.8088},
        {"name": "Mall de Goa", "description": "Largest mall in Goa with entertainment", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Porvorim, North Goa", "timings": "10:00 AM - 10:00 PM", "latitude": 15.5178, "longitude": 73.8214}
    ],
    "kerala": [
        {"name": "Lulu Mall", "description": "Largest mall in India with diverse shopping", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Edappally, Kochi", "timings": "10:00 AM - 10:00 PM", "latitude": 10.0261, "longitude": 76.3086},
        {"name": "Jew Town", "description": "Antique shops and spice markets in Mattancherry", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Mattancherry, Kochi", "timings": "10:00 AM - 6:00 PM", "latitude": 9.9578, "longitude": 76.2593},
        {"name": "Connemara Market", "description": "Traditional market with spices and handicrafts", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "MG Road, Thiruvananthapuram", "timings": "9:00 AM - 8:00 PM", "latitude": 8.4915, "longitude": 76.9500}
    ],
    "agra": [
        {"name": "Sadar Bazaar", "description": "Market for marble handicrafts and leather goods", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Sadar Bazaar, Agra", "timings": "10:00 AM - 9:00 PM", "latitude": 27.1870, "longitude": 78.0070},
        {"name": "Kinari Bazaar", "description": "Traditional market near Jama Masjid", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Near Jama Masjid, Agra", "timings": "10:00 AM - 8:00 PM", "latitude": 27.1790, "longitude": 78.0220},
        {"name": "TDI Mall", "description": "Modern shopping mall in Agra", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Fatehabad Road, Agra", "timings": "10:00 AM - 10:00 PM", "latitude": 27.1645, "longitude": 78.0278}
    ],
    "varanasi": [
        {"name": "Vishwanath Gali", "description": "Lane with silk sarees and religious items", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Near Kashi Vishwanath, Varanasi", "timings": "10:00 AM - 9:00 PM", "latitude": 25.3109, "longitude": 83.0107},
        {"name": "Godowlia Market", "description": "Central market for Banarasi silk and handicrafts", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Godowlia Chowk, Varanasi", "timings": "10:00 AM - 9:00 PM", "latitude": 25.3100, "longitude": 83.0090},
        {"name": "IP Mall", "description": "Modern mall with multiplex cinema", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Sigra, Varanasi", "timings": "10:00 AM - 10:00 PM", "latitude": 25.3228, "longitude": 82.9944}
    ],
    "mumbai": [
        {"name": "Colaba Causeway", "description": "Street shopping for fashion and souvenirs", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Colaba, Mumbai", "timings": "10:00 AM - 10:00 PM", "latitude": 18.9167, "longitude": 72.8319},
        {"name": "Phoenix Palladium", "description": "Luxury mall with high-end brands", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Lower Parel, Mumbai", "timings": "11:00 AM - 11:00 PM", "latitude": 18.9940, "longitude": 72.8259},
        {"name": "Crawford Market", "description": "Historic market with wholesale goods", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Near CST, Mumbai", "timings": "10:00 AM - 8:00 PM", "latitude": 18.9470, "longitude": 72.8339}
    ],
    "udaipur": [
        {"name": "Hathi Pol Bazaar", "description": "Traditional market for handicrafts and miniature paintings", "image_url": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80", "address": "Near City Palace, Udaipur", "timings": "10:00 AM - 8:00 PM", "latitude": 24.5780, "longitude": 73.6820},
        {"name": "Bada Bazaar", "description": "Colorful market with Rajasthani textiles", "image_url": "https://images.unsplash.com/photo-1604923517951-d293af28f553?auto=format&fit=crop&q=80", "address": "Clock Tower, Udaipur", "timings": "10:00 AM - 8:00 PM", "latitude": 24.5790, "longitude": 73.6850},
        {"name": "Celebration Mall", "description": "Modern shopping and entertainment complex", "image_url": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80", "address": "Bhuwana, Udaipur", "timings": "10:00 AM - 10:00 PM", "latitude": 24.5550, "longitude": 73.6990}
    ]
}

TRANSPORT_DATA = {
    "delhi": [
        {"type": "flight", "name": "Indira Gandhi International Airport", "description": "Major international hub with connections worldwide", "from_location": "Mumbai/Bangalore/Chennai", "to_location": "Delhi", "duration": "2-3 hours", "price_range": "₹3,000 - ₹15,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Rajdhani Express", "description": "Premium AC train connecting major cities", "from_location": "Mumbai/Kolkata/Chennai", "to_location": "Delhi", "duration": "16-30 hours", "price_range": "₹1,500 - ₹4,500", "frequency": "Daily"},
        {"type": "bus", "name": "Volvo AC Bus", "description": "Comfortable overnight buses", "from_location": "Jaipur/Chandigarh/Agra", "to_location": "Delhi", "duration": "4-8 hours", "price_range": "₹500 - ₹1,500", "frequency": "Hourly"},
        {"type": "local", "name": "Delhi Metro", "description": "Extensive metro network covering entire NCR", "from_location": "Within Delhi", "to_location": "All major areas", "duration": "Varies", "price_range": "₹10 - ₹60", "frequency": "Every 3-5 mins"}
    ],
    "jaipur": [
        {"type": "flight", "name": "Jaipur International Airport", "description": "Connected to major Indian cities", "from_location": "Delhi/Mumbai/Bangalore", "to_location": "Jaipur", "duration": "1-2.5 hours", "price_range": "₹2,500 - ₹12,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Shatabdi Express", "description": "Fast day train from Delhi", "from_location": "Delhi", "to_location": "Jaipur", "duration": "4.5 hours", "price_range": "₹800 - ₹1,500", "frequency": "Daily"},
        {"type": "bus", "name": "RSRTC Volvo", "description": "State transport luxury buses", "from_location": "Delhi/Udaipur/Agra", "to_location": "Jaipur", "duration": "5-8 hours", "price_range": "₹400 - ₹1,200", "frequency": "Every hour"},
        {"type": "local", "name": "Auto Rickshaw", "description": "Prepaid autos from major points", "from_location": "Within Jaipur", "to_location": "All areas", "duration": "Varies", "price_range": "₹50 - ₹300", "frequency": "Always available"}
    ],
    "goa": [
        {"type": "flight", "name": "Dabolim & Mopa Airports", "description": "Two international airports", "from_location": "Delhi/Mumbai/Bangalore", "to_location": "Goa", "duration": "1.5-2.5 hours", "price_range": "₹3,000 - ₹20,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Konkan Railway", "description": "Scenic route along Western Ghats", "from_location": "Mumbai/Mangalore", "to_location": "Goa", "duration": "8-12 hours", "price_range": "₹400 - ₹2,000", "frequency": "Multiple daily"},
        {"type": "bus", "name": "Paulo Travels", "description": "Premium sleeper buses", "from_location": "Mumbai/Bangalore/Pune", "to_location": "Goa", "duration": "10-14 hours", "price_range": "₹800 - ₹2,000", "frequency": "Daily"},
        {"type": "local", "name": "Rent a Scooter", "description": "Best way to explore Goa", "from_location": "Within Goa", "to_location": "Beaches/Towns", "duration": "Varies", "price_range": "₹300 - ₹600/day", "frequency": "Always available"}
    ],
    "kerala": [
        {"type": "flight", "name": "Cochin International Airport", "description": "India's first solar-powered airport", "from_location": "Delhi/Mumbai/Dubai", "to_location": "Kochi", "duration": "2.5-4 hours", "price_range": "₹4,000 - ₹25,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Kerala Express", "description": "Direct train from North India", "from_location": "Delhi/Chennai/Bangalore", "to_location": "Various Kerala stations", "duration": "18-40 hours", "price_range": "₹600 - ₹3,500", "frequency": "Daily"},
        {"type": "bus", "name": "KSRTC Volvo", "description": "State transport comfortable buses", "from_location": "Bangalore/Chennai/Coimbatore", "to_location": "Kerala cities", "duration": "6-12 hours", "price_range": "₹500 - ₹1,500", "frequency": "Multiple daily"},
        {"type": "local", "name": "Houseboat", "description": "Traditional kettuvallam for backwaters", "from_location": "Alleppey", "to_location": "Backwater cruise", "duration": "1-2 days", "price_range": "₹6,000 - ₹25,000", "frequency": "Daily"}
    ],
    "agra": [
        {"type": "flight", "name": "Agra Airport", "description": "Limited connectivity, Lucknow preferred", "from_location": "Limited routes", "to_location": "Agra", "duration": "Varies", "price_range": "₹4,000 - ₹10,000", "frequency": "Limited"},
        {"type": "train", "name": "Gatimaan Express", "description": "India's fastest train", "from_location": "Delhi", "to_location": "Agra", "duration": "100 minutes", "price_range": "₹750 - ₹1,500", "frequency": "Daily"},
        {"type": "bus", "name": "UPSRTC AC Bus", "description": "Frequent buses from Delhi", "from_location": "Delhi/Jaipur", "to_location": "Agra", "duration": "4-5 hours", "price_range": "₹300 - ₹800", "frequency": "Every 30 mins"},
        {"type": "local", "name": "Electric Rickshaw", "description": "Eco-friendly way to visit monuments", "from_location": "Within Agra", "to_location": "All monuments", "duration": "Varies", "price_range": "₹30 - ₹200", "frequency": "Always available"}
    ],
    "varanasi": [
        {"type": "flight", "name": "Lal Bahadur Shastri Airport", "description": "Connected to major Indian cities", "from_location": "Delhi/Mumbai/Kolkata", "to_location": "Varanasi", "duration": "1.5-2.5 hours", "price_range": "₹3,500 - ₹15,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Kashi Express", "description": "Regular trains from major cities", "from_location": "Delhi/Mumbai/Kolkata", "to_location": "Varanasi", "duration": "8-20 hours", "price_range": "₹500 - ₹2,500", "frequency": "Multiple daily"},
        {"type": "bus", "name": "UPSRTC Bus", "description": "State transport buses", "from_location": "Lucknow/Allahabad/Gorakhpur", "to_location": "Varanasi", "duration": "4-8 hours", "price_range": "₹300 - ₹800", "frequency": "Hourly"},
        {"type": "local", "name": "Boat Ride", "description": "Essential ghat and sunrise experience", "from_location": "Various Ghats", "to_location": "Along the Ganges", "duration": "1-2 hours", "price_range": "₹100 - ₹500", "frequency": "Always available"}
    ],
    "mumbai": [
        {"type": "flight", "name": "Chhatrapati Shivaji International", "description": "Major international gateway", "from_location": "Worldwide", "to_location": "Mumbai", "duration": "2-15 hours", "price_range": "₹3,000 - ₹80,000", "frequency": "Hundreds daily"},
        {"type": "train", "name": "Mumbai Rajdhani", "description": "Premium train to Delhi and North India", "from_location": "Delhi/Ahmedabad/Chennai", "to_location": "Mumbai", "duration": "8-24 hours", "price_range": "₹1,200 - ₹4,000", "frequency": "Multiple daily"},
        {"type": "bus", "name": "Neeta/VRL Travels", "description": "Luxury sleeper buses", "from_location": "Bangalore/Pune/Goa", "to_location": "Mumbai", "duration": "8-14 hours", "price_range": "₹600 - ₹2,500", "frequency": "Multiple daily"},
        {"type": "local", "name": "Mumbai Local Train", "description": "Lifeline of Mumbai, extensive network", "from_location": "Within Mumbai", "to_location": "Entire city", "duration": "Varies", "price_range": "₹5 - ₹30", "frequency": "Every 3 mins"}
    ],
    "udaipur": [
        {"type": "flight", "name": "Maharana Pratap Airport", "description": "Domestic airport with good connectivity", "from_location": "Delhi/Mumbai/Jaipur", "to_location": "Udaipur", "duration": "1-2 hours", "price_range": "₹3,000 - ₹12,000", "frequency": "Multiple daily"},
        {"type": "train", "name": "Udaipur City Express", "description": "Trains from major cities", "from_location": "Delhi/Jaipur/Ahmedabad", "to_location": "Udaipur", "duration": "8-14 hours", "price_range": "₹400 - ₹2,000", "frequency": "Daily"},
        {"type": "bus", "name": "RSRTC Volvo", "description": "Comfortable buses from Rajasthan cities", "from_location": "Jaipur/Ahmedabad/Jodhpur", "to_location": "Udaipur", "duration": "6-10 hours", "price_range": "₹500 - ₹1,200", "frequency": "Multiple daily"},
        {"type": "local", "name": "Lake Boat", "description": "Boat rides on Lake Pichola", "from_location": "City Palace Ghat", "to_location": "Jag Mandir", "duration": "1 hour", "price_range": "₹400 - ₹800", "frequency": "Hourly"}
    ]
}

# ============== SEED DATABASE ==============

async def seed_database():
    """Seed the database with initial data if empty"""
    # Check if destinations already exist
    existing = await db.destinations.count_documents({})
    if existing > 0:
        return
    
    # Seed destinations
    for dest in DESTINATIONS_DATA:
        dest_doc = {**dest, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.destinations.insert_one(dest_doc)
    
    # Seed hotels, attractions, shopping, transport for each destination
    for dest_id, hotels in HOTELS_DATA.items():
        for hotel in hotels:
            hotel_doc = {
                "id": str(uuid.uuid4()),
                "destination_id": dest_id,
                **hotel
            }
            await db.hotels.insert_one(hotel_doc)
    
    for dest_id, attractions in ATTRACTIONS_DATA.items():
        for attraction in attractions:
            attr_doc = {
                "id": str(uuid.uuid4()),
                "destination_id": dest_id,
                **attraction
            }
            await db.attractions.insert_one(attr_doc)
    
    for dest_id, shops in SHOPPING_DATA.items():
        for shop in shops:
            shop_doc = {
                "id": str(uuid.uuid4()),
                "destination_id": dest_id,
                **shop
            }
            await db.shopping.insert_one(shop_doc)
    
    for dest_id, transports in TRANSPORT_DATA.items():
        for transport in transports:
            trans_doc = {
                "id": str(uuid.uuid4()),
                "destination_id": dest_id,
                **transport
            }
            await db.transport.insert_one(trans_doc)
    
    logger.info("Database seeded successfully!")

# ============== API ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "DiscoVerYatra API - Explore India!"}

@api_router.get("/destinations", response_model=List[Dict])
async def get_destinations():
    """Get all destinations"""
    await seed_database()
    destinations = await db.destinations.find({}, {"_id": 0}).to_list(100)
    return destinations

@api_router.get("/destinations/search")
async def search_destinations(q: str = Query(..., min_length=1)):
    """Search destinations by name or state"""
    await seed_database()
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"state": {"$regex": q, "$options": "i"}},
            {"popular_for": {"$elemMatch": {"$regex": q, "$options": "i"}}}
        ]
    }
    destinations = await db.destinations.find(query, {"_id": 0}).to_list(20)
    return destinations

@api_router.get("/destinations/{destination_id}")
async def get_destination(destination_id: str):
    """Get destination details"""
    await seed_database()
    destination = await db.destinations.find_one({"id": destination_id}, {"_id": 0})
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination

@api_router.get("/destinations/{destination_id}/hotels")
async def get_destination_hotels(destination_id: str):
    """Get hotels for a destination"""
    await seed_database()
    hotels = await db.hotels.find({"destination_id": destination_id}, {"_id": 0}).to_list(50)
    return hotels

@api_router.get("/destinations/{destination_id}/attractions")
async def get_destination_attractions(destination_id: str):
    """Get attractions for a destination"""
    await seed_database()
    attractions = await db.attractions.find({"destination_id": destination_id}, {"_id": 0}).to_list(50)
    return attractions

@api_router.get("/destinations/{destination_id}/shopping")
async def get_destination_shopping(destination_id: str):
    """Get shopping places for a destination"""
    await seed_database()
    shopping = await db.shopping.find({"destination_id": destination_id}, {"_id": 0}).to_list(50)
    return shopping

@api_router.get("/destinations/{destination_id}/transport")
async def get_destination_transport(destination_id: str):
    """Get transport options for a destination"""
    await seed_database()
    transport = await db.transport.find({"destination_id": destination_id}, {"_id": 0}).to_list(50)
    return transport

@api_router.post("/ai/description")
async def get_ai_description(request: AIDescriptionRequest):
    """Generate AI-powered description for a destination"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"travel-{request.destination_name}-{request.topic}",
            system_message="You are an expert travel guide for India. Provide engaging, informative, and culturally accurate descriptions. Keep responses concise but informative (2-3 paragraphs max)."
        )
        chat.with_model("openai", "gpt-5.2")
        
        prompts = {
            "overview": f"Provide a captivating overview of {request.destination_name}, India. Include its historical significance, cultural importance, and what makes it unique.",
            "culture": f"Describe the local culture, traditions, and customs of {request.destination_name}. Include festivals, art forms, and local practices.",
            "food": f"Describe the famous local cuisine and must-try dishes in {request.destination_name}. Include street food and traditional restaurants.",
            "tips": f"Provide essential travel tips for visiting {request.destination_name}. Include best time to visit, what to pack, and local etiquette."
        }
        
        prompt = prompts.get(request.topic, prompts["overview"])
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"description": response, "topic": request.topic, "destination": request.destination_name}
    except Exception as e:
        logger.error(f"AI description error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI description")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
