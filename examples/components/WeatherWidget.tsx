/**
 * Weather Widget Component
 * Example component for displaying weather data from the weather MCP server
 */

import { useToolOutput, useTheme, useComponentContext } from '../../src/lib/use-open-apps';
import { useState } from 'react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  unit: string;
  timestamp: string;
}

interface WeatherWidgetProps {
  data?: WeatherData;
}

export function WeatherWidget({ data: propData }: WeatherWidgetProps = {}) {
  const contextData = useToolOutput<WeatherData>();
  const weatherData = propData || contextData;
  const theme = useTheme();
  const { callTool } = useComponentContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!weatherData) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <p className="text-sm opacity-70">No weather data available</p>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await callTool('get_weather', { location: weatherData.location });
    } catch (error) {
      console.error('Failed to refresh weather:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('sunny')) return '☀️';
    if (cond.includes('cloudy')) return '☁️';
    if (cond.includes('rainy') || cond.includes('rain')) return '🌧️';
    if (cond.includes('foggy')) return '🌫️';
    if (cond.includes('partly')) return '⛅';
    return '🌤️';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 80) return 'text-red-500';
    if (temp >= 70) return 'text-orange-500';
    if (temp >= 60) return 'text-yellow-500';
    if (temp >= 50) return 'text-blue-400';
    return 'text-blue-600';
  };

  return (
    <div 
      className={`weather-widget rounded-lg p-6 max-w-md ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900'
      }`}
      style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{weatherData.location}</h3>
          <p className="text-xs opacity-70">
            {new Date(weatherData.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700' 
              : 'hover:bg-blue-200'
          }`}
          title="Refresh"
        >
          <span className={isRefreshing ? 'inline-block animate-spin' : ''}>
            🔄
          </span>
        </button>
      </div>

      {/* Main Temperature Display */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">
          {getWeatherIcon(weatherData.condition)}
        </div>
        <div className={`text-5xl font-bold mb-2 ${getTemperatureColor(weatherData.temperature)}`}>
          {weatherData.temperature}°{weatherData.unit === 'fahrenheit' ? 'F' : 'C'}
        </div>
        <div className="text-lg opacity-90">{weatherData.condition}</div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-3 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700 bg-opacity-50' : 'bg-white bg-opacity-50'
        }`}>
          <div className="text-xs opacity-70 mb-1">Humidity</div>
          <div className="text-lg font-semibold">💧 {weatherData.humidity}%</div>
        </div>
        <div className={`p-3 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700 bg-opacity-50' : 'bg-white bg-opacity-50'
        }`}>
          <div className="text-xs opacity-70 mb-1">Wind Speed</div>
          <div className="text-lg font-semibold">💨 {weatherData.windSpeed} mph</div>
        </div>
      </div>
    </div>
  );
}
