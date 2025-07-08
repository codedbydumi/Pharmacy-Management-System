import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Prepare request payload - match your backend DTO exactly
    const payload = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2)); // Debug log

    try {
      const response = await fetch('http://localhost:5137/api/Auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Fixed: was 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response ok:', response.ok); // Debug log

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If response is text, try to parse it
        const textData = await response.text();
        console.log('Response text:', textData); // Debug log
        
        try {
          data = JSON.parse(textData);
        } catch {
          data = { message: textData };
        }
      }

      console.log('Response data:', JSON.stringify(data, null, 2)); // Debug log

      if (response.ok) {
        // Store the tokens and user info in localStorage or state management
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.userId) localStorage.setItem('userId', data.userId);
        if (data.email) localStorage.setItem('email', data.email);
        if (data.roles) localStorage.setItem('roles', JSON.stringify(data.roles));
        
        // Show success message or redirect
        alert('Registration successful!');
        navigate('/');
      } else {
        // Handle different error response formats
        let errorMessage = 'Registration failed. Please try again.';
        
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          // Handle ModelState validation errors
          const validationErrors = [];
          for (const [field, fieldErrors] of Object.entries(data.errors)) {
            validationErrors.push(...fieldErrors);
          }
          errorMessage = validationErrors.join(', ');
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network error:', error); // Debug log
      setError('Network error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl px-12 pt-10 pb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Pharmacy Portal</h1>
            <p className="text-gray-600 mt-2">Inventory Management System</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input 
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500" 
              id="email" 
              type="email" 
              required 
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input 
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500" 
              id="password" 
              type="password" 
              required 
              placeholder="Enter your password (min 8 chars, include uppercase, lowercase, digit, special char)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
              First Name
            </label>
            <input 
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500" 
              id="firstName" 
              type="text" 
              required 
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
              Last Name
            </label>
            <input 
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500" 
              id="lastName" 
              type="text" 
              required 
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-70 disabled:transform-none"
            >
              {isLoading ? 'Signing up...' : 'Signup'}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account? 
              <a href="/" className="text-purple-600 hover:text-purple-800 ml-1">Login</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;