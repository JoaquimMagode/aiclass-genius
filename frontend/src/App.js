import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  Search, MapPin, Star, Clock, IndianRupee, Plane, Train, Bus, 
  Navigation, Building2, ShoppingBag, Camera, Utensils, Info,
  ChevronRight, Calendar, Users, Heart, ArrowLeft, Loader2, Sparkles
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== COMPONENTS ==============

const Navbar = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200" data-testid="navbar">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <MapPin className="w-6 h-6 text-[#FF9933]" />
            <span className="text-xl font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Disco<span className="text-[#FF9933]">Ver</span>Yatra
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-stone-600 hover:text-[#FF9933]"
              onClick={() => navigate('/')}
              data-testid="explore-btn"
            >
              Explore
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = ({ onSearch, searchQuery, setSearchQuery, searchResults, isSearching }) => {
  const navigate = useNavigate();
  
  return (
    <section className="hero-section" data-testid="hero-section">
      <img 
        src="https://images.unsplash.com/photo-1732308988547-bfbcf9171f69?auto=format&fit=crop&q=80" 
        alt="Taj Mahal at Golden Hour"
        className="hero-image"
      />
      <div className="hero-overlay" />
      
      <div className="hero-content">
        <h1 
          className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in-up"
          style={{ fontFamily: 'Playfair Display, serif' }}
          data-testid="hero-title"
        >
          Discover <span className="text-[#FF9933]">India</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl animate-fade-in-up delay-100" data-testid="hero-subtitle">
          Explore the land of diverse cultures, ancient heritage, and breathtaking landscapes
        </p>
        
        <div className="relative w-full max-w-xl animate-fade-in-up delay-200">
          <div className="search-container flex items-center">
            <Search className="w-5 h-5 text-stone-400 ml-4" />
            <Input
              type="text"
              placeholder="Search destinations... (e.g., Delhi, Goa, Kerala)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  onSearch(e.target.value);
                }
              }}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-stone-400"
              data-testid="search-input"
            />
            <Button 
              className="btn-primary"
              onClick={() => onSearch(searchQuery)}
              data-testid="search-button"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </Button>
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && searchQuery.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-20" data-testid="search-results">
              {searchResults.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => {
                    navigate(`/destination/${dest.id}`);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors text-left"
                  data-testid={`search-result-${dest.id}`}
                >
                  <img 
                    src={dest.image_url} 
                    alt={dest.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-stone-800">{dest.name}</h4>
                    <p className="text-sm text-stone-500">{dest.state}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400 ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in-up delay-300">
          {['History', 'Beaches', 'Mountains', 'Temples', 'Wildlife'].map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30 cursor-pointer px-4 py-2"
              onClick={() => onSearch(tag)}
              data-testid={`tag-${tag.toLowerCase()}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};

const DestinationCard = ({ destination, featured = false }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`destination-card group ${featured ? 'aspect-[4/5] md:aspect-auto' : 'aspect-[4/5]'}`}
      onClick={() => navigate(`/destination/${destination.id}`)}
      data-testid={`destination-card-${destination.id}`}
    >
      <img 
        src={destination.image_url} 
        alt={destination.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="destination-card-overlay" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#FF9933]" />
          <span className="text-sm opacity-90">{destination.state}</span>
        </div>
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {destination.name}
        </h3>
        <p className="text-sm opacity-80 line-clamp-2 mb-3">
          {destination.short_description}
        </p>
        <div className="flex flex-wrap gap-2">
          {destination.popular_for?.slice(0, 3).map((tag) => (
            <Badge key={tag} className="bg-white/20 text-white text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="secondary" className="rounded-full bg-white/90 hover:bg-white">
          <Heart className="w-4 h-4 text-[#FF007F]" />
        </Button>
      </div>
    </div>
  );
};

const FeaturedDestinations = ({ destinations, loading }) => {
  if (loading) {
    return (
      <section className="py-20 bg-[#FAF9F6]" data-testid="featured-destinations">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
            Featured Destinations
          </h2>
          <div className="bento-grid">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className={`h-80 rounded-2xl ${i === 0 ? 'md:h-full' : ''}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-20 bg-[#FAF9F6]" data-testid="featured-destinations">
      <div className="section-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Featured Destinations
            </h2>
            <p className="text-stone-500 mt-2">Explore the most beautiful places in India</p>
          </div>
        </div>
        
        <div className="bento-grid">
          {destinations.slice(0, 5).map((dest, index) => (
            <DestinationCard 
              key={dest.id} 
              destination={dest} 
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const AllDestinations = ({ destinations }) => {
  return (
    <section className="py-20 bg-white" data-testid="all-destinations">
      <div className="section-container">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
          All Destinations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#1A1A2E] text-white py-16" data-testid="footer">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-[#FF9933]" />
              <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Disco<span className="text-[#FF9933]">Ver</span>Yatra
              </span>
            </div>
            <p className="text-stone-400 max-w-md">
              Your ultimate guide to exploring the incredible diversity of India. 
              From the snow-capped Himalayas to the tropical beaches of Kerala.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#FF9933]">Popular Destinations</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link to="/destination/delhi" className="hover:text-white transition-colors">Delhi</Link></li>
              <li><Link to="/destination/jaipur" className="hover:text-white transition-colors">Jaipur</Link></li>
              <li><Link to="/destination/goa" className="hover:text-white transition-colors">Goa</Link></li>
              <li><Link to="/destination/kerala" className="hover:text-white transition-colors">Kerala</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-[#FF9933]">Travel Info</h4>
            <ul className="space-y-2 text-stone-400">
              <li className="hover:text-white transition-colors cursor-pointer">Best Time to Visit</li>
              <li className="hover:text-white transition-colors cursor-pointer">Travel Tips</li>
              <li className="hover:text-white transition-colors cursor-pointer">Safety Guidelines</li>
              <li className="hover:text-white transition-colors cursor-pointer">Contact Us</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-stone-500">
          <p>© 2025 DiscoVerYatra. Made with love for India.</p>
        </div>
      </div>
    </footer>
  );
};

// ============== PAGES ==============

const HomePage = () => {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(`${API}/destinations`);
      setDestinations(response.data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API}/destinations/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div data-testid="home-page">
      <Navbar />
      <HeroSection 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
      />
      <FeaturedDestinations destinations={destinations} loading={loading} />
      <AllDestinations destinations={destinations} />
      <Footer />
    </div>
  );
};

const DestinationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiDescription, setAiDescription] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [destRes, hotelsRes, attractionsRes, shoppingRes, transportRes] = await Promise.all([
        axios.get(`${API}/destinations/${id}`),
        axios.get(`${API}/destinations/${id}/hotels`),
        axios.get(`${API}/destinations/${id}/attractions`),
        axios.get(`${API}/destinations/${id}/shopping`),
        axios.get(`${API}/destinations/${id}/transport`)
      ]);
      
      setDestination(destRes.data);
      setHotels(hotelsRes.data);
      setAttractions(attractionsRes.data);
      setShopping(shoppingRes.data);
      setTransport(transportRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load destination details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIDescription = async (topic) => {
    if (!destination) return;
    
    setLoadingAI(true);
    try {
      const response = await axios.post(`${API}/ai/description`, {
        destination_name: destination.name,
        topic: topic
      });
      setAiDescription(response.data.description);
      toast.success('AI description generated!');
    } catch (error) {
      console.error('Error fetching AI description:', error);
      toast.error('Failed to generate AI description');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]" data-testid="destination-page-loading">
        <Navbar />
        <div className="pt-20">
          <Skeleton className="h-[50vh] w-full" />
          <div className="section-container py-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Destination not found</h2>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  const getTransportIcon = (type) => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'train': return <Train className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      default: return <Navigation className="w-5 h-5" />;
    }
  };

  const getTransportClass = (type) => {
    switch (type) {
      case 'flight': return 'transport-flight';
      case 'train': return 'transport-train';
      case 'bus': return 'transport-bus';
      default: return 'transport-local';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]" data-testid="destination-page">
      <Navbar />
      
      {/* Hero */}
      <div className="relative h-[50vh] pt-16">
        <img 
          src={destination.image_url} 
          alt={destination.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="section-container">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to destinations
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-[#FF9933]" />
              <span className="text-white/90">{destination.state}</span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
              data-testid="destination-title"
            >
              {destination.name}
            </h1>
            
            <div className="flex flex-wrap gap-3">
              {destination.popular_for?.map((tag) => (
                <Badge key={tag} className="bg-white/20 text-white">
                  {tag}
                </Badge>
              ))}
              <Badge className="bg-[#FF9933] text-white">
                <Calendar className="w-3 h-3 mr-1" />
                Best: {destination.best_time_to_visit}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="section-container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-white rounded-xl p-1 mb-8 overflow-x-auto" data-testid="tabs-list">
            <TabsTrigger value="overview" className="tab-trigger" data-testid="tab-overview">
              <Info className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="hotels" className="tab-trigger" data-testid="tab-hotels">
              <Building2 className="w-4 h-4 mr-2" /> Hotels
            </TabsTrigger>
            <TabsTrigger value="attractions" className="tab-trigger" data-testid="tab-attractions">
              <Camera className="w-4 h-4 mr-2" /> Attractions
            </TabsTrigger>
            <TabsTrigger value="shopping" className="tab-trigger" data-testid="tab-shopping">
              <ShoppingBag className="w-4 h-4 mr-2" /> Shopping
            </TabsTrigger>
            <TabsTrigger value="transport" className="tab-trigger" data-testid="tab-transport">
              <Plane className="w-4 h-4 mr-2" /> Transport
            </TabsTrigger>
            <TabsTrigger value="map" className="tab-trigger" data-testid="tab-map">
              <MapPin className="w-4 h-4 mr-2" /> Map
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" data-testid="tab-content-overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>
                      About {destination.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600 leading-relaxed">
                      {destination.description}
                    </p>
                  </CardContent>
                </Card>
                
                {/* AI Description */}
                <Card className="border-[#008080]/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      <Sparkles className="w-5 h-5 text-[#FF9933]" />
                      AI Travel Guide
                    </CardTitle>
                    <div className="flex gap-2">
                      {['overview', 'culture', 'food', 'tips'].map((topic) => (
                        <Button
                          key={topic}
                          variant="outline"
                          size="sm"
                          onClick={() => fetchAIDescription(topic)}
                          disabled={loadingAI}
                          className="capitalize"
                          data-testid={`ai-btn-${topic}`}
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingAI ? (
                      <div className="flex items-center gap-3 text-stone-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating AI description...
                      </div>
                    ) : aiDescription ? (
                      <p className="text-stone-600 leading-relaxed whitespace-pre-line" data-testid="ai-description">
                        {aiDescription}
                      </p>
                    ) : (
                      <p className="text-stone-400 italic">
                        Click a topic above to generate AI-powered travel insights
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9933]/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#FF9933]" />
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Best Time to Visit</p>
                        <p className="font-medium">{destination.best_time_to_visit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#008080]" />
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">State</p>
                        <p className="font-medium">{destination.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF007F]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#FF007F]" />
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Hotels Available</p>
                        <p className="font-medium">{hotels.length} options</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9933]/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-[#FF9933]" />
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Attractions</p>
                        <p className="font-medium">{attractions.length} places</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Mini Map */}
                <Card>
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="map-container h-48">
                      <MapContainer 
                        center={[destination.latitude, destination.longitude]} 
                        zoom={10} 
                        className="h-full w-full"
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <Marker position={[destination.latitude, destination.longitude]}>
                          <Popup>{destination.name}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Hotels Tab */}
          <TabsContent value="hotels" data-testid="tab-content-hotels">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="hotel-card overflow-hidden" data-testid={`hotel-card-${hotel.id}`}>
                  <div className="relative h-48">
                    <img 
                      src={hotel.image_url} 
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 price-tag">
                      <IndianRupee className="w-4 h-4 inline" />
                      {hotel.price_per_night.toLocaleString()}/night
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-stone-800">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-[#FF9933]">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{hotel.rating}</span>
                      </div>
                    </div>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{hotel.description}</p>
                    <div className="flex items-center gap-2 text-stone-400 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      {hotel.address}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities?.slice(0, 4).map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Attractions Tab */}
          <TabsContent value="attractions" data-testid="tab-content-attractions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attractions.map((attraction) => (
                <Card key={attraction.id} className="hotel-card overflow-hidden" data-testid={`attraction-card-${attraction.id}`}>
                  <div className="relative h-48">
                    <img 
                      src={attraction.image_url} 
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-[#008080] text-white">{attraction.category}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-stone-800 mb-2">{attraction.name}</h3>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{attraction.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-stone-500">
                        <Clock className="w-4 h-4" />
                        {attraction.timings}
                      </div>
                      <div className="flex items-center gap-1 text-[#FF9933] font-medium">
                        <IndianRupee className="w-4 h-4" />
                        {attraction.entry_fee === 0 ? 'Free' : attraction.entry_fee}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Shopping Tab */}
          <TabsContent value="shopping" data-testid="tab-content-shopping">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopping.map((shop) => (
                <Card key={shop.id} className="hotel-card overflow-hidden" data-testid={`shopping-card-${shop.id}`}>
                  <div className="relative h-48">
                    <img 
                      src={shop.image_url} 
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-stone-800 mb-2">{shop.name}</h3>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{shop.description}</p>
                    <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      {shop.address}
                    </div>
                    <div className="flex items-center gap-2 text-stone-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {shop.timings}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Transport Tab */}
          <TabsContent value="transport" data-testid="tab-content-transport">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transport.map((item) => (
                <Card key={item.id} className="transport-card" data-testid={`transport-card-${item.id}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTransportClass(item.type)}`}>
                      {getTransportIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-stone-800 mb-1">{item.name}</h3>
                      <p className="text-stone-500 text-sm mb-3">{item.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-stone-400">From</p>
                          <p className="font-medium text-stone-700">{item.from_location}</p>
                        </div>
                        <div>
                          <p className="text-stone-400">To</p>
                          <p className="font-medium text-stone-700">{item.to_location}</p>
                        </div>
                        <div>
                          <p className="text-stone-400">Duration</p>
                          <p className="font-medium text-stone-700">{item.duration}</p>
                        </div>
                        <div>
                          <p className="text-stone-400">Frequency</p>
                          <p className="font-medium text-stone-700">{item.frequency}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Price Range</span>
                          <span className="text-lg font-bold text-[#FF9933]">{item.price_range}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Map Tab */}
          <TabsContent value="map" data-testid="tab-content-map">
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>
                  Explore {destination.name} on Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="map-container h-[500px]">
                  <MapContainer 
                    center={[destination.latitude, destination.longitude]} 
                    zoom={12} 
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    
                    {/* Destination marker */}
                    <Marker position={[destination.latitude, destination.longitude]}>
                      <Popup>
                        <strong>{destination.name}</strong>
                        <br />
                        {destination.short_description}
                      </Popup>
                    </Marker>
                    
                    {/* Hotel markers */}
                    {hotels.map((hotel) => (
                      <Marker key={hotel.id} position={[hotel.latitude, hotel.longitude]}>
                        <Popup>
                          <strong>{hotel.name}</strong>
                          <br />
                          ₹{hotel.price_per_night}/night
                          <br />
                          Rating: {hotel.rating}
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Attraction markers */}
                    {attractions.map((attr) => (
                      <Marker key={attr.id} position={[attr.latitude, attr.longitude]}>
                        <Popup>
                          <strong>{attr.name}</strong>
                          <br />
                          {attr.category}
                          <br />
                          Entry: {attr.entry_fee === 0 ? 'Free' : `₹${attr.entry_fee}`}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>City Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Hotels ({hotels.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Attractions ({attractions.length})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

// ============== APP ==============

function App() {
  return (
    <div className="App">
      <div className="grain-overlay" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/destination/:id" element={<DestinationPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
