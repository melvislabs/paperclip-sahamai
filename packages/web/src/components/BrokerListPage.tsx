import { useState, useEffect } from 'react';
import { Search, Filter, Star, Shield, Phone, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import type { Broker, BrokerFilters, OjkLicenseStatus } from '@sahamai/shared';
import { fetchApi } from '../lib/api';

interface BrokerListPageProps {
  onBrokerSelect: (broker: Broker) => void;
}

export function BrokerListPage({ onBrokerSelect }: BrokerListPageProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<BrokerFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBrokers();
  }, [searchTerm, filters]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchTerm) queryParams.append('search', searchTerm);
      if (filters.ojkStatus) queryParams.append('ojkStatus', filters.ojkStatus);
      if (filters.hasApi !== undefined) queryParams.append('hasApi', filters.hasApi.toString());
      if (filters.hasMobileApp !== undefined) queryParams.append('hasMobileApp', filters.hasMobileApp.toString());
      if (filters.minRating) queryParams.append('minRating', filters.minRating.toString());
      if (filters.maxBuyFee) queryParams.append('maxBuyFee', filters.maxBuyFee.toString());
      if (filters.features?.length) {
        filters.features.forEach(feature => queryParams.append('features', feature));
      }
      if (filters.accountTypes?.length) {
        filters.accountTypes.forEach(type => queryParams.append('accountTypes', type));
      }

      const data = await fetchApi<Broker[]>(`/v1/brokers?${queryParams}`);
      setBrokers(data);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OjkLicenseStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'SUSPENDED': return 'text-yellow-600 bg-yellow-100';
      case 'REVOKED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: OjkLicenseStatus) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'SUSPENDED': return <AlertCircle className="w-4 h-4" />;
      case 'REVOKED': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const BrokerCard = ({ broker }: { broker: Broker }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onBrokerSelect(broker)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {broker.logoUrl && (
            <img 
              src={broker.logoUrl} 
              alt={broker.name}
              className="w-12 h-12 rounded-lg object-contain"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{broker.name}</h3>
            <p className="text-sm text-gray-500">{broker.legalName}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(broker.ojkLicenseStatus)}`}>
          {getStatusIcon(broker.ojkLicenseStatus)}
          <span>{broker.ojkLicenseStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="w-4 h-4" />
          <span>OJK: {broker.ojkLicenseNumber}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <span>Since {broker.establishedYear}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4" />
            <span>{broker.headquarters.city}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span>4.2/5</span>
          </div>
        </div>
        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
          View Details →
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Brokers</h1>
        <p className="text-gray-600">Compare and find the best broker for your trading needs</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search brokers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OJK Status</label>
                <select
                  value={filters.ojkStatus || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    ojkStatus: e.target.value as OjkLicenseStatus || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasApi || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasApi: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">API Access</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasMobileApp || false}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasMobileApp: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Mobile App</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Buy Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxBuyFee || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    maxBuyFee: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="e.g., 0.25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchBrokers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600">
          {loading ? 'Loading...' : `Found ${brokers.length} brokers`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers.map(broker => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>
      )}

      {!loading && brokers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No brokers found matching your criteria.</p>
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Clear filters and try again
          </button>
        </div>
      )}
    </div>
  );
}
