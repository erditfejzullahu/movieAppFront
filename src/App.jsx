import { useEffect, useState } from 'react'
import './App.css'
import Search from './components/Search'
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [movieList, setMovieList] = useState([])

  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingIsLoading, setTrendingIsLoading] = useState(false)
  const [trendingErrorMessage, setTrendingErrorMessage] = useState('')

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])
  
  const fetchTrendingMovies = async () => {
    setTrendingIsLoading(true);
    setTrendingErrorMessage("");
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      setTrendingErrorMessage("Error in fetching featured movies");
    } finally {
      setTrendingIsLoading(false);
    }
  }

  const fetchMovies = async (query = '') => {
    setErrorMessage('')
    setIsLoading(true)
    try {
      const endpoint = query 
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` 
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok){
        throw new Error('Failed to fetch movies')
      }
      const data = await response.json();
      if(data.response === 'false'){
        setErrorMessage("Failed to fetch movies")
        setMovieList([])
      }
      setMovieList(data.results || []);

      if(query && data.results.length > 0 ){
        await updateSearchCount(query, data.results[0])
      }
      
    } catch (error) {
      console.error(`error in getting movies: ${error}`);
      setErrorMessage("Error fetching movies, please try again later!");
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingMovies()
  }, [])
  

  useEffect(() => {
    fetchMovies(searchTerm);
  }, [debouncedSearchTerm])
  
  return (
    <main>
      <div className="pattern"/>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>

        <h2 className="mt-6">Trending Movies</h2>
        {trendingIsLoading ? (
          <p className="text-white py-2">Loading...</p>
        ) : trendingErrorMessage ? (
          <p className="text-red-500">{trendingErrorMessage}</p>
        ) : (
          <section className="trending mt-4">
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 className="mt-[40px]">All Movies</h2>
          {isLoading ? (
            <p className="text-white">Loading...</p>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App