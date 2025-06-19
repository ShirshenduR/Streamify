import './SearchBar.css';

export default function SearchBar({ query, setQuery }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button className="clear-btn" onClick={() => setQuery('')}>
          ✕
        </button>
      )}
    </div>
  );
}