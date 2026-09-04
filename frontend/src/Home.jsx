import { Link } from 'react-router-dom';
import irctcLogo from './assets/irctc_logo.png';

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
      <div className="flex max-w-md flex-col items-center rounded-2xl bg-white p-10 shadow-2xl">
        <img src={irctcLogo} alt="Indian Railways Logo" className="mb-8 w-48" />
        <h1 className="mb-2 text-4xl font-extrabold text-[#172b4d]">Indian Railways</h1>
        <p className="mb-8 text-gray-600">Centralized Network Management Portal</p>
        <Link 
          to="/login" 
          className="w-full rounded-lg bg-[#fb7f1c] px-8 py-3 text-lg font-bold text-white shadow-md transition-colors hover:bg-[#e16f15]"
        >
          Secure Login
        </Link>
      </div>
    </div>
  );
};

export default Home;