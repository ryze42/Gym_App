import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api.mjs';
import { useNavigate } from 'react-router';
import { useAuthenticate } from '../authentication/useAuthenticate';

function BlogPosts({ initialPosts = [], currentUser }) {
  const [blogPosts, setBlogPosts] = useState(initialPosts);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const authKey = localStorage.getItem("authKey");
  const { user } = useAuthenticate();
  const navigate = useNavigate();


  useEffect(() => {
    if (!authKey) {
        navigate("/authenticate");
    }
  }, [authKey, navigate]); 
  
  useEffect(() => {
    setIsLoading(true);
    fetchAPI("GET", "/blog_posts", null, authKey)
      .then(res => {
        if (res.status && res.status !== 200) {
          throw new Error(res.message || `Error ${res.status}`);
        }
        const posts = Array.isArray(res) ? res : res.body;
        if (!Array.isArray(posts)) {
          throw new Error("Unexpected data format");
        }
        setBlogPosts(posts);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = { subject, content };
    try {
      const response = await fetchAPI('POST', '/blog_posts', newPost);
      console.log("Create response:", response);
      
      if (response && response.id) {
        const createdPost = {
          id: response.id,
          user_id: currentUser.id,
          subject: subject,
          content: content,
          user: {
            first_name: currentUser.first_name || currentUser.username || "Current",
            last_name: currentUser.last_name || "User"
          }
        };
        
        setBlogPosts([createdPost, ...blogPosts]);
        setSubject('');
        setContent('');
      } else {
        console.error('Failed to create post or unexpected response format');
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const response = await fetchAPI('DELETE', `/blog_posts/${id}`);
      console.log("Delete response:", response);
      
      if (response) {
        setBlogPosts(blogPosts.filter(post => post.id !== id));
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const renderBlogPost = (post) => {
    const hasUserInfo = post.user && (post.user.first_name || post.user.last_name);
    
    return (
      <div className="card bg-white text-black shadow-md" key={post.id}>
        <div className="card-body flex justify-between items-start">
          <div className="space-y-1">
            {hasUserInfo && (
              <p className="text-sm">
                <span className="font-semibold text-gray-700">User:</span>{' '}
                {post.user.first_name || ''} {post.user.last_name || ''}
              </p>
            )}
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Subject:</span> {post.subject}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Content:</span> {post.content}
            </p>
          </div>
          {(currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin')) && (
            <button
              className="btn btn-error btn-sm"
              onClick={() => handleDelete(post.id)}
              aria-label="Delete post"
            >
              ❌
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="text-white min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex flex-col flex-1">
        <h1 className="text-2xl font-bold text-center mb-6">Blog Posts</h1>
        <div className="flex flex-col gap-6"> 
          <div className="card bg-white text-black shadow-lg">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    className="input input-bordered bg-white text-black w-full"
                    placeholder="Enter Subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    id="content"
                    className="textarea textarea-bordered bg-white text-black w-full h-48 resize-y"
                    placeholder="Enter Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <button type="button" className="btn btn-outline"
                    onClick={() => { setSubject(''); setContent(''); }}>
                    Clear
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create New Blog Post
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <p className="text-center text-lg mt-4 text-gray-300">Loading blog posts...</p>
            ) : error ? (
              <p className="text-center text-lg mt-4 text-red-500">{error}</p>
            ) : blogPosts && blogPosts.length > 0 ? (
              blogPosts.map(post => renderBlogPost(post))
            ) : (
              <p className="text-center text-lg mt-4 text-gray-300">No blog posts available.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default BlogPosts;