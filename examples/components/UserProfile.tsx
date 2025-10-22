/**
 * User Profile Component
 * Displays detailed user information
 */

import { useComponentContext, useTheme } from '../../src/lib/use-open-apps';

interface UserAddress {
  city: string;
  street: string;
  number: number;
  zipcode: string;
  geolocation: {
    lat: string;
    long: string;
  };
}

interface UserName {
  firstname: string;
  lastname: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
  name: UserName;
  address: UserAddress;
  phone: string;
}

export function UserProfile() {
  const { toolOutput, callTool, sendFollowup } = useComponentContext<any, User>();
  const theme = useTheme();

  const user = toolOutput;

  if (!user) {
    return (
      <div className={`p-8 text-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="text-lg opacity-70">User not found</p>
      </div>
    );
  }

  const handleViewCarts = async () => {
    try {
      await callTool('get_user_carts', { userId: user.id });
    } catch (error) {
      console.error('Failed to get user carts:', error);
    }
  };

  const handleEditProfile = async () => {
    await sendFollowup('I want to edit my profile');
  };

  return (
    <div className={`user-profile max-w-4xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`rounded-lg overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-xl`}>
        {/* Header Banner */}
        <div className={`h-32 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-blue-900 to-purple-900' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`} />

        {/* Profile Content */}
        <div className="px-8 pb-8">
          {/* Avatar and Name */}
          <div className="flex items-end gap-6 -mt-16 mb-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            } border-4 ${
              theme === 'dark' ? 'border-gray-800' : 'border-white'
            } shadow-lg`}>
              👤
            </div>
            <div className="flex-1 pb-2">
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {user.name.firstname} {user.name.lastname}
              </h1>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                @{user.username}
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              ✏️ Edit Profile
            </button>
          </div>

          {/* Info Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                📧 Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`text-sm font-medium block mb-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Email
                  </label>
                  <div className={`flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>{user.email}</span>
                    <button
                      className={`text-xs ${
                        theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                      title="Copy email"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium block mb-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Phone
                  </label>
                  <div className={`flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span>{user.phone}</span>
                    <button
                      className={`text-xs ${
                        theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                      title="Copy phone"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium block mb-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    User ID
                  </label>
                  <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    #{user.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                🏠 Address
              </h3>
              <div className="space-y-2">
                <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {user.address.number} {user.address.street}
                </div>
                <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {user.address.city}, {user.address.zipcode}
                </div>
                <div className={`text-sm mt-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  📍 {user.address.geolocation.lat}, {user.address.geolocation.long}
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                📊 Account Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    --
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Orders
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    --
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Favorites
                  </div>
                </div>
              </div>
              <button
                onClick={handleViewCarts}
                className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                🛒 View Shopping Carts
              </button>
            </div>

            {/* Account Actions */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ⚙️ Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  📦 Order History
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  ❤️ Saved Items
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  💳 Payment Methods
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  🔒 Privacy Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
