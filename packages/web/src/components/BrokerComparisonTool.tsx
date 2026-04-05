import { useState, useEffect } from 'react';
import { Plus, X, ArrowRight, Calculator, Star, CheckCircle } from 'lucide-react';
import type { Broker, BrokerComparison, FeeCalculation } from '@sahamai/shared';
import { fetchApi } from '../lib/api';

interface BrokerComparisonToolProps {
  onClose: () => void;
}

export function BrokerComparisonTool({ onClose }: BrokerComparisonToolProps) {
  const [availableBrokers, setAvailableBrokers] = useState<Broker[]>([]);
  const [selectedBrokers, setSelectedBrokers] = useState<Broker[]>([]);
  const [comparison, setComparison] = useState<BrokerComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [volume, setVolume] = useState(10000000); // 10M IDR default
  const [feeCalculations, setFeeCalculations] = useState<FeeCalculation[]>([]);

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const data = await fetchApi<Broker[]>('/v1/brokers');
      setAvailableBrokers(data);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    }
  };

  const addBroker = (broker: Broker) => {
    if (selectedBrokers.length < 5 && !selectedBrokers.find(b => b.id === broker.id)) {
      setSelectedBrokers([...selectedBrokers, broker]);
    }
  };

  const removeBroker = (brokerId: string) => {
    setSelectedBrokers(selectedBrokers.filter(b => b.id !== brokerId));
  };

  const compareBrokers = async () => {
    if (selectedBrokers.length < 2) return;
    
    setLoading(true);
    try {
      const data = await fetchApi<BrokerComparison>('/v1/brokers/compare', {
        method: 'POST',
        body: JSON.stringify({
          brokerIds: selectedBrokers.map(b => b.id)
        })
      });

      setComparison(data);
      calculateFees();
    } catch (error) {
      console.error('Error comparing brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = async () => {
    setCalculating(true);
    try {
      const calculations = await Promise.all(
        selectedBrokers.map(async (broker) => {
          return fetchApi<FeeCalculation>('/v1/brokers/fees/calculator', {
            method: 'POST',
            body: JSON.stringify({ brokerId: broker.id, volume })
          }).catch(() => null);
        })
      );
      setFeeCalculations(calculations.filter(Boolean) as FeeCalculation[]);
    } catch (error) {
      console.error('Error calculating fees:', error);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600';
      case 'SUSPENDED': return 'text-yellow-600';
      case 'REVOKED': return 'text-red-600';
      default: return 'text-gray-600';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Broker Comparison</h2>
              <p className="text-gray-600">Compare brokers side by side to find the best fit</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Broker Selection Sidebar */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select Brokers (2-5)</h3>
            
            {/* Selected Brokers */}
            <div className="mb-4">
              <div className="space-y-2">
                {selectedBrokers.map(broker => (
                  <div key={broker.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                    <span className="text-sm font-medium text-blue-900">{broker.name}</span>
                    <button
                      onClick={() => removeBroker(broker.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Broker Button */}
            <div className="mb-4">
              <button
                onClick={() => {
                  // Show broker selection modal or dropdown
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center space-x-2"
                disabled={selectedBrokers.length >= 5}
              >
                <Plus className="w-4 h-4" />
                <span>Add Broker</span>
              </button>
            </div>

            {/* Available Brokers List */}
            <div className="max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-2">Available brokers:</p>
              <div className="space-y-1">
                {availableBrokers
                  .filter(broker => !selectedBrokers.find(sb => sb.id === broker.id))
                  .slice(0, 10)
                  .map(broker => (
                    <button
                      key={broker.id}
                      onClick={() => addBroker(broker)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center justify-between"
                      disabled={selectedBrokers.length >= 5}
                    >
                      <span>{broker.name}</span>
                      <Plus className="w-3 h-3 text-gray-400" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Compare Button */}
            <button
              onClick={compareBrokers}
              disabled={selectedBrokers.length < 2 || loading}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Comparing...</span>
              ) : (
                <>
                  <span>Compare Brokers</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Comparison Results */}
          <div className="flex-1 overflow-auto">
            {comparison ? (
              <div className="p-6">
                {/* Fee Calculator */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Fee Calculator</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trading Volume (IDR)
                      </label>
                      <input
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1000000"
                        step="1000000"
                      />
                    </div>
                    <button
                      onClick={calculateFees}
                      disabled={calculating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 mt-6"
                    >
                      {calculating ? 'Calculating...' : 'Calculate'}
                    </button>
                  </div>
                  
                  {feeCalculations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Estimated Fees:</h4>
                      <div className="space-y-2">
                        {feeCalculations.map(calc => (
                          <div key={calc.brokerId} className="flex justify-between text-sm">
                            <span className="font-medium">{calc.brokerName}</span>
                            <span className="text-gray-600">{formatCurrency(calc.totalFee)} ({calc.effectiveRate.toFixed(3)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comparison Table */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Feature</th>
                            {comparison.brokers.map(broker => (
                              <th key={broker.id} className="text-left py-2 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium">{broker.name}</span>
                                  <span className={`text-sm ${getStatusColor(broker.ojkLicenseStatus)}`}>
                                    {broker.ojkLicenseStatus}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Legal Name</td>
                            {comparison.brokers.map(broker => (
                              <td key={broker.id} className="py-3 px-4 text-sm">{broker.legalName}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Established</td>
                            {comparison.brokers.map(broker => (
                              <td key={broker.id} className="py-3 px-4 text-sm">{broker.establishedYear}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">OJK License</td>
                            {comparison.brokers.map(broker => (
                              <td key={broker.id} className="py-3 px-4 text-sm">{broker.ojkLicenseNumber}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trading Fees */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Trading Fees</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Fee Type</th>
                            {comparison.brokers.map(broker => (
                              <th key={broker.id} className="text-left py-2 px-4 font-medium">{broker.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Buy Fee</td>
                            {comparison.fees.map(fee => (
                              <td key={fee.brokerId} className="py-3 px-4 text-sm">
                                {fee.tradingFees.equity.buyFee}% (min {formatCurrency(fee.tradingFees.equity.minimumFee)})
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Sell Fee</td>
                            {comparison.fees.map(fee => (
                              <td key={fee.brokerId} className="py-3 px-4 text-sm">
                                {fee.tradingFees.equity.sellFee}% (min {formatCurrency(fee.tradingFees.equity.minimumFee)})
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Trading Features</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Feature</th>
                            {comparison.brokers.map(broker => (
                              <th key={broker.id} className="text-left py-2 px-4 font-medium">{broker.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Web Trading</td>
                            {comparison.features.map(feature => (
                              <td key={feature.brokerId} className="py-3 px-4 text-sm">
                                {feature.tradingPlatforms.web.available ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500" />
                                )}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Mobile App</td>
                            {comparison.features.map(feature => (
                              <td key={feature.brokerId} className="py-3 px-4 text-sm">
                                {feature.tradingPlatforms.mobile.ios || feature.tradingPlatforms.mobile.android ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500" />
                                )}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">API Access</td>
                            {comparison.features.map(feature => (
                              <td key={feature.brokerId} className="py-3 px-4 text-sm">
                                {feature.apiAccess.available ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500" />
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">User Reviews</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium text-gray-700">Metric</th>
                            {comparison.brokers.map(broker => (
                              <th key={broker.id} className="text-left py-2 px-4 font-medium">{broker.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Average Rating</td>
                            {comparison.brokers.map(broker => {
                              const reviewData = comparison.reviews[broker.id];
                              return (
                                <td key={broker.id} className="py-3 px-4 text-sm">
                                  {reviewData ? (
                                    <div className="flex items-center space-x-1">
                                      <span>{reviewData.averageRating.toFixed(1)}</span>
                                      {renderStars(Math.round(reviewData.averageRating))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No reviews</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Total Reviews</td>
                            {comparison.brokers.map(broker => {
                              const reviewData = comparison.reviews[broker.id];
                              return (
                                <td key={broker.id} className="py-3 px-4 text-sm">
                                  {reviewData ? reviewData.totalReviews : 0}
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-600">Recommendation Rate</td>
                            {comparison.brokers.map(broker => {
                              const reviewData = comparison.reviews[broker.id];
                              return (
                                <td key={broker.id} className="py-3 px-4 text-sm">
                                  {reviewData ? `${(reviewData.recommendationRate * 100).toFixed(1)}%` : 'N/A'}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <Calculator className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-2">Select 2-5 brokers to compare</p>
                  <p className="text-sm text-gray-500">Add brokers from the left panel to see detailed comparison</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
