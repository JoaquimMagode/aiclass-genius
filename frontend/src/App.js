import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  Search, MapPin, Star, Clock, IndianRupee, Plane, Train, Bus, 
  Navigation, Building2, ShoppingBag, Camera, Info,
  ChevronRight, Calendar, Users, Heart, ArrowLeft, Loader2, Sparkles,
  Vote, UserPlus, Share2, Check, Crown, Home, Compass, PlusCircle,
  BarChart3, Scale, Copy, X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW registration failed'));
  });
}

// ============== COMPONENTS ==============

const Navbar = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200" data-testid="navbar">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <Vote className="w-7 h-7 text-[#FF9933]" />
            <span className="text-xl font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Pack<span className="text-[#FF9933]">Vote</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-stone-600 hover:text-[#FF9933]"
              onClick={() => navigate('/')}
              data-testid="home-btn"
            >
              <Home className="w-4 h-4 mr-1" /> Home
            </Button>
            <Button 
              variant="ghost" 
              className="text-stone-600 hover:text-[#FF9933]"
              onClick={() => navigate('/explore')}
              data-testid="explore-btn"
            >
              <Compass className="w-4 h-4 mr-1" /> Explore
            </Button>
            <Button 
              className="btn-primary"
              onClick={() => navigate('/create-trip')}
              data-testid="create-trip-btn"
            >
              <PlusCircle className="w-4 h-4 mr-1" /> Create Trip
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const BottomNav = () => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 md:hidden" data-testid="bottom-nav">
      <div className="flex items-center justify-around py-2">
        <button onClick={() => navigate('/')} className="flex flex-col items-center p-2 text-stone-600 hover:text-[#FF9933]">
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button onClick={() => navigate('/explore')} className="flex flex-col items-center p-2 text-stone-600 hover:text-[#FF9933]">
          <Compass className="w-5 h-5" />
          <span className="text-xs mt-1">Explore</span>
        </button>
        <button onClick={() => navigate('/create-trip')} className="flex flex-col items-center p-2 text-[#FF9933]">
          <PlusCircle className="w-6 h-6" />
          <span className="text-xs mt-1">New Trip</span>
        </button>
        <button onClick={() => navigate('/compare')} className="flex flex-col items-center p-2 text-stone-600 hover:text-[#FF9933]">
          <Scale className="w-5 h-5" />
          <span className="text-xs mt-1">Compare</span>
        </button>
      </div>
    </div>
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
        <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
          <Vote className="w-12 h-12 text-[#FF9933]" />
          <h1 className="text-5xl md:text-7xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="hero-title">
            Pack<span className="text-[#FF9933]">Vote</span>
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-white/90 mb-4 animate-fade-in-up delay-100" data-testid="hero-subtitle">
          Plan trips together. Vote. Travel!
        </p>
        <p className="text-lg text-white/70 mb-8 max-w-2xl animate-fade-in-up delay-100">
          Perfect for friends, families & corporate teams exploring India
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-200">
          <Button 
            className="btn-primary text-lg px-8 py-6"
            onClick={() => navigate('/create-trip')}
            data-testid="start-planning-btn"
          >
            <Users className="w-5 h-5 mr-2" /> Start Group Planning
          </Button>
          <Button 
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-6"
            onClick={() => navigate('/join-trip')}
            data-testid="join-trip-btn"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Join a Trip
          </Button>
        </div>
        
        <div className="relative w-full max-w-xl mt-12 animate-fade-in-up delay-300 z-40">
          <div className="search-container flex items-center relative z-40">
            <Search className="w-5 h-5 text-stone-400 ml-4" />
            <Input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) onSearch(e.target.value);
              }}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-stone-400"
              data-testid="search-input"
            />
            <Button className="btn-primary" onClick={() => onSearch(searchQuery)} data-testid="search-button">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
            </Button>
          </div>
          
          {searchResults.length > 0 && searchQuery.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-50" data-testid="search-results">
              {searchResults.map((dest) => (
                <button
                  key={dest.id}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/destination/${dest.id}`); setSearchQuery(''); }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors text-left relative z-50"
                  data-testid={`search-result-${dest.id}`}
                >
                  <img src={dest.image_url} alt={dest.name} className="w-16 h-16 rounded-xl object-cover" />
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
      </div>
    </section>
  );
};

const FeatureCards = () => {
  const navigate = useNavigate();
  const features = [
    { icon: <Sparkles className="w-8 h-8" />, title: "AI Suggestions", desc: "Get personalized destination recommendations", color: "bg-purple-500", link: "/ai-suggest" },
    { icon: <Scale className="w-8 h-8" />, title: "Compare", desc: "Compare destinations, hotels & budgets", color: "bg-blue-500", link: "/compare" },
    { icon: <Vote className="w-8 h-8" />, title: "Group Voting", desc: "Vote together to finalize your trip", color: "bg-green-500", link: "/create-trip" },
    { icon: <BarChart3 className="w-8 h-8" />, title: "Budget Tracker", desc: "Track expenses for your group", color: "bg-orange-500", link: "/explore" },
  ];
  
  return (
    <section className="py-16 bg-white" data-testid="features-section">
      <div className="section-container">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
          Why PackVote?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card 
              key={i} 
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => navigate(f.link)}
              data-testid={`feature-card-${i}`}
            >
              <CardContent className="pt-6">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center text-white mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const DestinationCard = ({ destination, selectable = false, selected = false, onSelect }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(destination.id);
    } else {
      navigate(`/destination/${destination.id}`);
    }
  };
  
  return (
    <div 
      className={`destination-card group aspect-[4/5] ${selected ? 'ring-4 ring-[#FF9933]' : ''}`}
      onClick={handleClick}
      data-testid={`destination-card-${destination.id}`}
    >
      <img src={destination.image_url} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="destination-card-overlay" />
      
      {selectable && (
        <div className="absolute top-4 left-4">
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-[#FF9933] border-[#FF9933]' : 'border-white bg-white/20'}`}>
            {selected && <Check className="w-5 h-5 text-white" />}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#FF9933]" />
          <span className="text-sm opacity-90">{destination.state}</span>
        </div>
        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{destination.name}</h3>
        <p className="text-sm opacity-80 line-clamp-2 mb-3">{destination.short_description}</p>
        {destination.budget_per_day && (
          <Badge className="bg-[#FF9933] text-white">
            <IndianRupee className="w-3 h-3 mr-1" />
            {destination.budget_per_day}/day
          </Badge>
        )}
      </div>
    </div>
  );
};

const FeaturedDestinations = ({ destinations, loading }) => {
  if (loading) {
    return (
      <section className="py-20 bg-[#FAF9F6]" data-testid="featured-destinations">
        <div className="section-container">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Popular Destinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-20 bg-[#FAF9F6]" data-testid="featured-destinations">
      <div className="section-container">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.slice(0, 8).map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#1A1A2E] text-white py-16 mb-16 md:mb-0" data-testid="footer">
    <div className="section-container">
      <div className="flex items-center gap-2 mb-4">
        <Vote className="w-6 h-6 text-[#FF9933]" />
        <span className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Pack<span className="text-[#FF9933]">Vote</span></span>
      </div>
      <p className="text-stone-400 max-w-md mb-8">
        Plan group trips to India with AI suggestions, compare options, and vote together to finalize your perfect adventure.
      </p>
      <div className="border-t border-stone-800 pt-8 text-center text-stone-500">
        <p>© 2025 PackVote. Made for travelers, by travelers.</p>
      </div>
    </div>
  </footer>
);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 2) { setSearchResults([]); return; }
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
      <HeroSection onSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} isSearching={isSearching} />
      <FeatureCards />
      <FeaturedDestinations destinations={destinations} loading={loading} />
      <Footer />
      <BottomNav />
    </div>
  );
};

const CreateTripPage = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tripData, setTripData] = useState({
    name: '',
    creator_name: '',
    group_type: 'friends',
    budget_per_person: '',
  });
  const [createdTrip, setCreatedTrip] = useState(null);

  useEffect(() => {
    axios.get(`${API}/destinations`).then(res => { setDestinations(res.data); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!tripData.name || !tripData.creator_name) {
      toast.error('Please fill in trip name and your name');
      return;
    }
    
    setCreating(true);
    try {
      const response = await axios.post(`${API}/trips`, {
        ...tripData,
        budget_per_person: tripData.budget_per_person ? parseInt(tripData.budget_per_person) : null
      });
      setCreatedTrip(response.data);
      toast.success('Trip created! Share the code with your group.');
    } catch (error) {
      toast.error('Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(createdTrip.invite_code);
    toast.success('Invite code copied!');
  };

  if (createdTrip) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-20" data-testid="trip-created-page">
        <Navbar />
        <div className="section-container py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Trip Created!</h2>
              <p className="text-stone-500 mb-6">Share this code with your group to start planning together</p>
              
              <div className="bg-stone-100 rounded-xl p-6 mb-6">
                <p className="text-sm text-stone-500 mb-2">Invite Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold tracking-widest text-[#FF9933]" data-testid="invite-code">{createdTrip.invite_code}</span>
                  <Button size="icon" variant="ghost" onClick={copyInviteCode} data-testid="copy-code-btn">
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <Button className="btn-primary w-full" onClick={() => navigate(`/trip/${createdTrip.trip_id}`)} data-testid="go-to-trip-btn">
                Go to Trip Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20" data-testid="create-trip-page">
      <Navbar />
      <div className="section-container py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Create a Trip</h1>
          <p className="text-stone-500 mb-8">Start planning your group adventure to India</p>
          
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Trip Name *</label>
                <Input 
                  placeholder="e.g., Goa Beach Trip 2025" 
                  value={tripData.name}
                  onChange={(e) => setTripData({...tripData, name: e.target.value})}
                  data-testid="trip-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Your Name *</label>
                <Input 
                  placeholder="e.g., Rahul" 
                  value={tripData.creator_name}
                  onChange={(e) => setTripData({...tripData, creator_name: e.target.value})}
                  data-testid="creator-name-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Group Type</label>
                <Select value={tripData.group_type} onValueChange={(v) => setTripData({...tripData, group_type: v})}>
                  <SelectTrigger data-testid="group-type-select">
                    <SelectValue placeholder="Select group type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate Team</SelectItem>
                    <SelectItem value="couple">Couple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Budget per Person (₹)</label>
                <Input 
                  type="number" 
                  placeholder="e.g., 15000" 
                  value={tripData.budget_per_person}
                  onChange={(e) => setTripData({...tripData, budget_per_person: e.target.value})}
                  data-testid="budget-input"
                />
              </div>
              
              <Button className="btn-primary w-full" onClick={handleCreate} disabled={creating} data-testid="create-trip-submit-btn">
                {creating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Users className="w-5 h-5 mr-2" />}
                Create Trip & Get Invite Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

const JoinTripPage = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode || !memberName) {
      toast.error('Please enter invite code and your name');
      return;
    }
    
    setJoining(true);
    try {
      const response = await axios.post(`${API}/trips/join`, {
        invite_code: inviteCode.toUpperCase(),
        member_name: memberName
      });
      toast.success(response.data.message);
      navigate(`/trip/${response.data.trip_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join trip');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20" data-testid="join-trip-page">
      <Navbar />
      <div className="section-container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Join a Trip</CardTitle>
            <CardDescription>Enter the invite code shared by your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Invite Code</label>
              <Input 
                placeholder="e.g., ABC123" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                data-testid="invite-code-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Name</label>
              <Input 
                placeholder="e.g., Priya" 
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                data-testid="member-name-input"
              />
            </div>
            
            <Button className="btn-primary w-full" onClick={handleJoin} disabled={joining} data-testid="join-trip-submit-btn">
              {joining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              Join Trip
            </Button>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

const TripDashboard = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('destinations');

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    try {
      const [tripRes, destRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}`),
        axios.get(`${API}/destinations`)
      ]);
      setTrip(tripRes.data);
      setDestinations(destRes.data);
      
      // Get results
      const resultsRes = await axios.get(`${API}/trips/${tripId}/results`);
      setResults(resultsRes.data);
    } catch (error) {
      toast.error('Failed to load trip');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (itemType, itemId) => {
    if (!voterName) {
      toast.error('Please enter your name first');
      return;
    }
    
    try {
      await axios.post(`${API}/trips/${tripId}/vote`, {
        trip_id: tripId,
        voter_name: voterName,
        item_type: itemType,
        item_id: itemId
      });
      toast.success('Vote recorded!');
      fetchData();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleFinalize = async () => {
    try {
      await axios.post(`${API}/trips/${tripId}/finalize`);
      toast.success('Trip finalized!');
      fetchData();
    } catch (error) {
      toast.error('Failed to finalize');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(trip.invite_code);
    toast.success('Invite code copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-20">
        <Navbar />
        <div className="section-container py-12">
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 pb-20" data-testid="trip-dashboard">
      <Navbar />
      <div className="section-container py-8">
        {/* Trip Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${trip.group_type === 'corporate' ? 'bg-blue-500' : trip.group_type === 'family' ? 'bg-green-500' : 'bg-purple-500'}`}>
                    {trip.group_type}
                  </Badge>
                  {trip.status === 'finalized' && <Badge className="bg-[#FF9933]">Finalized</Badge>}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="trip-title">
                  {trip.name}
                </h1>
                <p className="text-stone-500 mt-1">Created by {trip.creator_name} • {trip.members?.length || 1} members</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 rounded-xl px-4 py-2">
                  <p className="text-xs text-stone-500">Invite Code</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FF9933]" data-testid="trip-invite-code">{trip.invite_code}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyInviteCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Members */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-stone-700 mb-3">Members</p>
              <div className="flex flex-wrap gap-2">
                {trip.members?.map((m, i) => (
                  <Badge key={i} variant="secondary" className="py-1">
                    {m.is_creator && <Crown className="w-3 h-3 mr-1 text-[#FF9933]" />}
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Voter Name Input */}
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-stone-700">Your Name (for voting)</label>
              <Input 
                placeholder="Enter your name to vote" 
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                className="mt-2 max-w-xs"
                data-testid="voter-name-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Voting Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="destinations" data-testid="tab-destinations">
              <MapPin className="w-4 h-4 mr-2" /> Destinations
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              <BarChart3 className="w-4 h-4 mr-2" /> Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="destinations">
            <h2 className="text-xl font-bold mb-4">Vote for Destination</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <div key={dest.id} className="relative">
                  <DestinationCard destination={dest} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Button 
                      className="w-full bg-white/90 hover:bg-white text-stone-800"
                      onClick={() => handleVote('destination', dest.id)}
                      data-testid={`vote-dest-${dest.id}`}
                    >
                      <Vote className="w-4 h-4 mr-2" /> Vote
                      {results?.destination_votes?.[dest.id] && (
                        <Badge className="ml-2 bg-[#FF9933]">{results.destination_votes[dest.id]}</Badge>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Voting Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Destination Votes</h3>
                    {results?.destination_votes && Object.keys(results.destination_votes).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(results.destination_votes)
                          .sort((a, b) => b[1] - a[1])
                          .map(([destId, votes]) => {
                            const dest = destinations.find(d => d.id === destId);
                            return (
                              <div key={destId} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                                {dest && <img src={dest.image_url} alt={dest.name} className="w-12 h-12 rounded-lg object-cover" />}
                                <div className="flex-1">
                                  <p className="font-medium">{dest?.name || destId}</p>
                                </div>
                                <Badge className="bg-[#FF9933]">{votes} votes</Badge>
                                {destId === results.winning_destination && <Crown className="w-5 h-5 text-[#FF9933]" />}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-stone-500">No votes yet</p>
                    )}
                  </div>
                  
                  {trip.status !== 'finalized' && results?.winning_destination && (
                    <Button className="btn-primary w-full" onClick={handleFinalize} data-testid="finalize-btn">
                      Finalize Trip with Winner
                    </Button>
                  )}
                  
                  {trip.status === 'finalized' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-green-800">Trip Finalized!</p>
                      <p className="text-green-600">Destination: {trip.selected_destination}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

const ComparePage = () => {
  const [destinations, setDestinations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    axios.get(`${API}/destinations`).then(res => { setDestinations(res.data); setLoading(false); });
  }, []);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    } else {
      toast.error('Maximum 4 destinations can be compared');
    }
  };

  const handleCompare = async () => {
    if (selected.length < 2) {
      toast.error('Select at least 2 destinations to compare');
      return;
    }
    
    setComparing(true);
    try {
      const response = await axios.post(`${API}/compare`, {
        item_type: 'destinations',
        item_ids: selected
      });
      setComparison(response.data);
    } catch (error) {
      toast.error('Failed to compare');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 pb-20" data-testid="compare-page">
      <Navbar />
      <div className="section-container py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Compare Destinations</h1>
        <p className="text-stone-500 mb-8">Select up to 4 destinations to compare budgets, hotels, and more</p>
        
        {!comparison ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {destinations.map((dest) => (
                <DestinationCard 
                  key={dest.id} 
                  destination={dest} 
                  selectable 
                  selected={selected.includes(dest.id)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
            
            {selected.length > 0 && (
              <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t md:relative md:bottom-0 md:border-0 md:bg-transparent md:p-0">
                <Button className="btn-primary w-full md:w-auto" onClick={handleCompare} disabled={comparing} data-testid="compare-btn">
                  {comparing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Scale className="w-5 h-5 mr-2" />}
                  Compare {selected.length} Destinations
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" className="mb-6" onClick={() => setComparison(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Selection
            </Button>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-sm" data-testid="comparison-table">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left text-stone-500 font-medium">Attribute</th>
                    {comparison.items.map((item) => (
                      <th key={item.id} className="p-4 text-center">
                        <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover mx-auto mb-2" />
                        <span className="font-bold text-stone-800">{item.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 text-stone-600">State</td>
                    {comparison.items.map((item) => (
                      <td key={item.id} className="p-4 text-center font-medium">{item.state}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-stone-600">Best Time</td>
                    {comparison.items.map((item) => (
                      <td key={item.id} className="p-4 text-center">{item.best_time_to_visit}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-stone-600">Daily Budget</td>
                    {comparison.items.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        <Badge className="bg-[#FF9933]">₹{item.budget_per_day}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-stone-600">Avg Hotel Price</td>
                    {comparison.items.map((item) => (
                      <td key={item.id} className="p-4 text-center">₹{item.avg_hotel_price}/night</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 text-stone-600">Popular For</td>
                    {comparison.items.map((item) => (
                      <td key={item.id} className="p-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {item.popular_for?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

const AISuggestPage = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [formData, setFormData] = useState({
    group_type: 'friends',
    budget_per_person: '',
    duration_days: '',
    group_size: '',
    interests: []
  });

  const interests = ['Beaches', 'Mountains', 'History', 'Wildlife', 'Spirituality', 'Adventure', 'Food', 'Culture'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/suggestions`, {
        ...formData,
        budget_per_person: formData.budget_per_person ? parseInt(formData.budget_per_person) : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        group_size: formData.group_size ? parseInt(formData.group_size) : null
      });
      setSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 pb-20" data-testid="ai-suggest-page">
      <Navbar />
      <div className="section-container py-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-[#FF9933]" />
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800" style={{ fontFamily: 'Playfair Display, serif' }}>AI Travel Suggestions</h1>
        </div>
        <p className="text-stone-500 mb-8">Let AI recommend the perfect destination for your group</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Group Type</label>
                <Select value={formData.group_type} onValueChange={(v) => setFormData({...formData, group_type: v})}>
                  <SelectTrigger data-testid="ai-group-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate Team</SelectItem>
                    <SelectItem value="couple">Couple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Budget per Person (₹)</label>
                  <Input 
                    type="number" 
                    placeholder="e.g., 15000" 
                    value={formData.budget_per_person}
                    onChange={(e) => setFormData({...formData, budget_per_person: e.target.value})}
                    data-testid="ai-budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Duration (days)</label>
                  <Input 
                    type="number" 
                    placeholder="e.g., 5" 
                    value={formData.duration_days}
                    onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                    data-testid="ai-duration"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Group Size</label>
                <Input 
                  type="number" 
                  placeholder="e.g., 6" 
                  value={formData.group_size}
                  onChange={(e) => setFormData({...formData, group_size: e.target.value})}
                  data-testid="ai-group-size"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge 
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "secondary"}
                      className={`cursor-pointer ${formData.interests.includes(interest) ? 'bg-[#FF9933]' : ''}`}
                      onClick={() => {
                        if (formData.interests.includes(interest)) {
                          setFormData({...formData, interests: formData.interests.filter(i => i !== interest)});
                        } else {
                          setFormData({...formData, interests: [...formData.interests, interest]});
                        }
                      }}
                      data-testid={`interest-${interest.toLowerCase()}`}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button className="btn-primary w-full" onClick={handleSubmit} disabled={loading} data-testid="get-suggestions-btn">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Get AI Suggestions
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
                </div>
              ) : suggestions ? (
                <div className="prose prose-stone" data-testid="ai-suggestions-result">
                  <p className="whitespace-pre-line">{suggestions.suggestions}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                  <p>Fill in your preferences and click "Get AI Suggestions"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

const ExplorePage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/destinations`).then(res => { setDestinations(res.data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 pb-20" data-testid="explore-page">
      <Navbar />
      <div className="section-container py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Explore India</h1>
        <p className="text-stone-500 mb-8">Discover amazing destinations across the country</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
          ) : (
            destinations.map((dest) => <DestinationCard key={dest.id} destination={dest} />)
          )}
        </div>
      </div>
      <BottomNav />
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
      toast.error('Failed to load destination');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIDescription = async (topic) => {
    if (!destination) return;
    setLoadingAI(true);
    try {
      const response = await axios.post(`${API}/ai/description`, { destination_name: destination.name, topic });
      setAiDescription(response.data.description);
      toast.success('AI description generated!');
    } catch (error) {
      toast.error('Failed to generate AI description');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading || !destination) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-20">
        <Navbar />
        <Skeleton className="h-[50vh] w-full" />
        <div className="section-container py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20" data-testid="destination-page">
      <Navbar />
      
      <div className="relative h-[50vh] pt-16">
        <img src={destination.image_url} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="section-container">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white mb-4" data-testid="back-button">
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-[#FF9933]" />
              <span className="text-white/90">{destination.state}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="destination-title">
              {destination.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              {destination.popular_for?.map((tag) => <Badge key={tag} className="bg-white/20 text-white">{tag}</Badge>)}
              <Badge className="bg-[#FF9933] text-white"><Calendar className="w-3 h-3 mr-1" /> Best: {destination.best_time_to_visit}</Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="section-container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-white rounded-xl p-1 mb-8 overflow-x-auto">
            <TabsTrigger value="overview" className="tab-trigger" data-testid="tab-overview"><Info className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="hotels" className="tab-trigger" data-testid="tab-hotels"><Building2 className="w-4 h-4 mr-2" /> Hotels</TabsTrigger>
            <TabsTrigger value="attractions" className="tab-trigger" data-testid="tab-attractions"><Camera className="w-4 h-4 mr-2" /> Attractions</TabsTrigger>
            <TabsTrigger value="shopping" className="tab-trigger" data-testid="tab-shopping"><ShoppingBag className="w-4 h-4 mr-2" /> Shopping</TabsTrigger>
            <TabsTrigger value="transport" className="tab-trigger" data-testid="tab-transport"><Plane className="w-4 h-4 mr-2" /> Transport</TabsTrigger>
            <TabsTrigger value="map" className="tab-trigger" data-testid="tab-map"><MapPin className="w-4 h-4 mr-2" /> Map</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader><CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>About {destination.name}</CardTitle></CardHeader>
                  <CardContent><p className="text-stone-600 leading-relaxed">{destination.description}</p></CardContent>
                </Card>
                
                <Card className="border-[#008080]/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}><Sparkles className="w-5 h-5 text-[#FF9933]" /> AI Travel Guide</CardTitle>
                    <div className="flex gap-2">
                      {['overview', 'culture', 'food', 'tips'].map((topic) => (
                        <Button key={topic} variant="outline" size="sm" onClick={() => fetchAIDescription(topic)} disabled={loadingAI} className="capitalize" data-testid={`ai-btn-${topic}`}>{topic}</Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingAI ? (
                      <div className="flex items-center gap-3 text-stone-500"><Loader2 className="w-5 h-5 animate-spin" /> Generating...</div>
                    ) : aiDescription ? (
                      <p className="text-stone-600 leading-relaxed whitespace-pre-line" data-testid="ai-description">{aiDescription}</p>
                    ) : (
                      <p className="text-stone-400 italic">Click a topic above to generate AI-powered travel insights</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="mb-6">
                  <CardHeader><CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Quick Info</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF9933]/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-[#FF9933]" /></div>
                      <div><p className="text-sm text-stone-500">Best Time</p><p className="font-medium">{destination.best_time_to_visit}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center"><IndianRupee className="w-5 h-5 text-[#008080]" /></div>
                      <div><p className="text-sm text-stone-500">Daily Budget</p><p className="font-medium">₹{destination.budget_per_day || 3000}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF007F]/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-[#FF007F]" /></div>
                      <div><p className="text-sm text-stone-500">Hotels</p><p className="font-medium">{hotels.length} options</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hotels">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="hotel-card overflow-hidden" data-testid={`hotel-card-${hotel.id}`}>
                  <div className="relative h-48">
                    <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 price-tag"><IndianRupee className="w-4 h-4 inline" />{hotel.price_per_night.toLocaleString()}/night</div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-stone-800">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-[#FF9933]"><Star className="w-4 h-4 fill-current" /><span className="font-medium">{hotel.rating}</span></div>
                    </div>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{hotel.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities?.slice(0, 4).map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="attractions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attractions.map((attr) => (
                <Card key={attr.id} className="hotel-card overflow-hidden" data-testid={`attraction-card-${attr.id}`}>
                  <div className="relative h-48">
                    <img src={attr.image_url} alt={attr.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3"><Badge className="bg-[#008080] text-white">{attr.category}</Badge></div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-stone-800 mb-2">{attr.name}</h3>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{attr.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-stone-500"><Clock className="w-4 h-4" />{attr.timings}</div>
                      <div className="flex items-center gap-1 text-[#FF9933] font-medium"><IndianRupee className="w-4 h-4" />{attr.entry_fee === 0 ? 'Free' : attr.entry_fee}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="shopping">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopping.map((shop) => (
                <Card key={shop.id} className="hotel-card overflow-hidden" data-testid={`shopping-card-${shop.id}`}>
                  <div className="relative h-48"><img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" /></div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-stone-800 mb-2">{shop.name}</h3>
                    <p className="text-stone-500 text-sm mb-3 line-clamp-2">{shop.description}</p>
                    <div className="flex items-center gap-2 text-stone-400 text-sm"><MapPin className="w-4 h-4" />{shop.address}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="transport">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transport.map((item) => (
                <Card key={item.id} className="transport-card" data-testid={`transport-card-${item.id}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.type === 'flight' ? 'bg-blue-100 text-blue-600' : item.type === 'train' ? 'bg-green-100 text-green-600' : item.type === 'bus' ? 'bg-yellow-100 text-yellow-600' : 'bg-purple-100 text-purple-600'}`}>
                      {getTransportIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="capitalize mb-1">{item.type}</Badge>
                      <h3 className="font-bold text-lg text-stone-800 mb-1">{item.name}</h3>
                      <p className="text-stone-500 text-sm mb-3">{item.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-stone-400">From</p><p className="font-medium">{item.from_location}</p></div>
                        <div><p className="text-stone-400">Duration</p><p className="font-medium">{item.duration}</p></div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-stone-500">Price Range</span>
                        <span className="text-lg font-bold text-[#FF9933]">{item.price_range}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="map">
            <Card>
              <CardHeader><CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Explore {destination.name}</CardTitle></CardHeader>
              <CardContent>
                <div className="map-container h-[500px]">
                  <MapContainer center={[destination.latitude, destination.longitude]} zoom={12} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker position={[destination.latitude, destination.longitude]}><Popup><strong>{destination.name}</strong></Popup></Marker>
                    {hotels.map((h) => <Marker key={h.id} position={[h.latitude, h.longitude]}><Popup><strong>{h.name}</strong><br/>₹{h.price_per_night}/night</Popup></Marker>)}
                    {attractions.map((a) => <Marker key={a.id} position={[a.latitude, a.longitude]}><Popup><strong>{a.name}</strong><br/>{a.category}</Popup></Marker>)}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

// ============== APP ==============

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/destination/:id" element={<DestinationPage />} />
          <Route path="/create-trip" element={<CreateTripPage />} />
          <Route path="/join-trip" element={<JoinTripPage />} />
          <Route path="/trip/:tripId" element={<TripDashboard />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/ai-suggest" element={<AISuggestPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
