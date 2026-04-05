import { useState, useEffect } from 'react';
import { 
  Star, 
  Shield, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Code,
  BookOpen
} from 'lucide-react';
import type { Broker, BrokerReview } from '@sahamai/shared';
import { fetchApi } from '../lib/api';

interface BrokerDetailPageProps {
  brokerId: string;
  onBack: () => void;
}

export function BrokerDetailPage({ brokerId, onBack }: BrokerDetailPageProps) {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [reviews, setReviews] = useState<BrokerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'features' | 'reviews'>('overview');

  useEffect(() => {
    fetchBrokerDetails();
  }, [brokerId]);

  const fetchBrokerDetails = async () => {
    try {
      setLoading(true);
      
      const [brokerData, reviewsData] = await Promise.all([
        fetchApi<Broker>(`/v1/brokers/${brokerId}`),
        fetchApi<{ reviews: BrokerReview[] }>(`/v1/brokers/${brokerId}/reviews?limit=10`)
      ]);

      setBroker(brokerData);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error('Error fetching broker details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'SUSPENDED': return 'text-yellow-600 bg-yellow-100';
      case 'REVOKED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'SUSPENDED': 
      case 'REVOKED': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Broker Not Found</h1>
          <p className="text-gray-600 mb-4">The broker you're looking for doesn't exist.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Brokers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Brokers
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start space-x-4 mb-4 lg:mb-0">
            {broker.logoUrl && (
              <img 
                src={broker.logoUrl} 
                alt={broker.name}
                className="w-16 h-16 rounded-lg object-contain"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{broker.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{broker.legalName}</p>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(broker.ojkLicenseStatus)}`}>
                {getStatusIcon(broker.ojkLicenseStatus)}
                <span>{broker.ojkLicenseStatus}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-1">
              {renderStars(4.2)}
              <span className="text-gray-600 ml-2">4.2 (127 reviews)</span>
            </div>
            <div className="text-sm text-gray-500">
              Established {broker.establishedYear}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">OJK License</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{broker.ojkLicenseNumber}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Active Accounts</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">50,000+</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Market Share</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">8.5%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Uptime</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">99.9%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'fees', label: 'Fees' },
            { id: 'features', label: 'Features' },
            { id: 'reviews', label: `Reviews (${reviews.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {broker.name}</h2>
                <p className="text-gray-600 mb-4">
                  {broker.name} is a leading securities company in Indonesia, providing comprehensive 
                  trading services for stocks, mutual funds, and other financial instruments. 
                  With OJK license {broker.ojkLicenseNumber}, they offer reliable and secure trading 
                  platforms for both individual and institutional investors.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{broker.headquarters.address}, {broker.headquarters.city}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{broker.contactInfo.customerService.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{broker.contactInfo.customerService.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{broker.website}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Regulatory Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">OJK Registration:</span>
                        <span className="text-gray-900">{broker.regulatoryInfo.ojkRegistrationDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Compliance Check:</span>
                        <span className="text-gray-900">{broker.regulatoryInfo.lastComplianceCheck}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Customer Fund Protection:</span>
                        <span className="text-green-600">✓ Protected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Structure</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Equity Trading</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Buy Fee:</span>
                        <span className="ml-2 font-medium">0.18% (min IDR 5,000)</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Sell Fee:</span>
                        <span className="ml-2 font-medium">0.28% (min IDR 5,000)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Account Fees</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Maintenance:</span>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inactivity Fee:</span>
                      <span className="font-medium">IDR 50,000/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Withdrawal Fee:</span>
                      <span className="font-medium">IDR 5,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trading Features</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Trading Platforms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5 text-blue-600" />
                      <span>Web Trading</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      <span>Mobile App (iOS/Android)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Code className="w-5 h-5 text-purple-600" />
                      <span>API Access</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Research Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Technical Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Fundamental Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Market News</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Stock Screener</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Education</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Trading Tutorials</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Webinars</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.overallRating)}
                        </div>
                        <span className="text-sm text-gray-600">{review.overallRating}/5</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {review.tradingExperience} • {review.userAccountType}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {review.detailedReview && (
                    <p className="text-gray-700 mb-4">{review.detailedReview}</p>
                  )}
                  
                  {(review.pros.length > 0 || review.cons.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {review.pros.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Pros</h4>
                          <ul className="space-y-1">
                            {review.pros.map((pro, index) => (
                              <li key={index} className="text-sm text-gray-600">• {pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.cons.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Cons</h4>
                          <ul className="space-y-1">
                            {review.cons.map((con, index) => (
                              <li key={index} className="text-sm text-gray-600">• {con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Open Account
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Download Platform
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Contact Support
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Service</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium">{broker.contactInfo.customerService.phone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{broker.contactInfo.customerService.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Hours:</span>
                <p className="font-medium">{broker.contactInfo.customerService.workingHours}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Live Chat:</span>
                <p className="font-medium text-green-600">Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
