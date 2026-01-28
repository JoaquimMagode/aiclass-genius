# DiscoVerYatra - India Travel Website PRD

## Original Problem Statement
Create a travelling website for India with full details of places searched. It should include maps, hotels details, famous places, shopping malls, and public travelling details with prices.

## Architecture & Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Leaflet (OpenStreetMap)
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key for AI-powered descriptions
- **Maps**: OpenStreetMap via react-leaflet

## User Personas
1. **Domestic Tourists**: Indians planning trips within India
2. **International Tourists**: Foreign visitors exploring India
3. **Backpackers**: Budget travelers looking for affordable options
4. **Luxury Travelers**: Seeking premium hotels and experiences

## Core Requirements (Static)
1. Search for Indian destinations
2. View comprehensive destination details
3. Browse hotels with pricing
4. Explore tourist attractions with entry fees
5. Find shopping locations
6. Check transport options with fare details
7. Interactive maps with markers
8. AI-powered travel descriptions

## What's Been Implemented (January 2025)

### Backend APIs
- GET `/api/destinations` - List all destinations
- GET `/api/destinations/search?q=` - Search destinations
- GET `/api/destinations/{id}` - Get destination details
- GET `/api/destinations/{id}/hotels` - Get hotels
- GET `/api/destinations/{id}/attractions` - Get attractions
- GET `/api/destinations/{id}/shopping` - Get shopping places
- GET `/api/destinations/{id}/transport` - Get transport options
- POST `/api/ai/description` - Generate AI descriptions

### Frontend Pages
- **Home Page**: Hero section, search, featured destinations (Bento grid), all destinations
- **Destination Page**: Overview, Hotels, Attractions, Shopping, Transport, Map tabs

### Seed Data
8 destinations with complete data:
- Delhi, Jaipur, Goa, Kerala, Agra, Varanasi, Mumbai, Udaipur
- Each with 3 hotels, 3-4 attractions, 3 shopping places, 4 transport options

### Design Theme
"Vibrant Heritage" - Indian cultural theme
- Primary: Marigold Saffron (#FF9933)
- Secondary: Royal Teal (#008080)
- Accent: Rani Pink (#FF007F)
- Fonts: Playfair Display (headings), Outfit (body)

## Prioritized Backlog

### P0 (Critical) - Done ✅
- [x] Search functionality
- [x] Destination detail pages
- [x] Hotels with pricing
- [x] Attractions with entry fees
- [x] Transport with fares
- [x] Interactive maps
- [x] AI travel guide

### P1 (Important)
- [ ] User authentication
- [ ] Save/bookmark destinations
- [ ] Compare hotels
- [ ] Itinerary builder
- [ ] User reviews

### P2 (Nice to Have)
- [ ] Price alerts
- [ ] Booking integration
- [ ] Weather widget
- [ ] Multi-language support
- [ ] Dark mode

## Next Tasks
1. Add more destinations to database
2. Implement user authentication
3. Add itinerary/trip planning feature
4. Integrate real-time pricing APIs
5. Add user reviews and ratings
