import React, { useEffect, useState } from 'react';
import Loading from './Loading';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Community = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { axios } = useAppContext();

  const fetchImages = async () => {
    try {
      const { data } = await axios.get('/api/user/published-images');
      if (data.success) {
        setImages(data.images);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll scrollbar-hidden">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-purple-100">
        Community Images
      </h2>

      {images.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-5">
          {images.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-gray-300 shadow-md hover:shadow-lg transition-shadow duration-300 w-64"
            >
              {/* Click on image opens in new tab */}
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={item.imageUrl}
                  alt={`Community Image ${index + 1}`}
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
              </a>

              {/* Created by label */}
              <p className="absolute bottom-0 right-0 text-xs bg-black/50 backdrop-blur text-white px-4 py-1 rounded-tl-xl opacity-0 group-hover:opacity-100 transition duration-300">
                Created by {item.userName}
              </p>

              {/* Download button */}
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = item.imageUrl;
                  link.download = `chatbot_image_${index + 1}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 text-xs rounded opacity-0 group-hover:opacity-100 hover:bg-purple-700 transition duration-300"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-purple-200 mt-10">
          No images available.
        </p>
      )}
    </div>
  );
};

export default Community;
