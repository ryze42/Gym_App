import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api.mjs';
import { useNavigate } from 'react-router';
import { useAuthenticate } from '../authentication/useAuthenticate';

function BlogPostView({ initialPosts = [] }) {
  const [blogPosts, setBlogPosts] = useState(initialPosts);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authKey = localStorage.getItem('authKey');
  const { user } = useAuthenticate();
  const navigate = useNavigate();

  const subjectValid = subject.trim().length >= 3 && subject.trim().length <= 100;
  const contentValid = content.trim().length >= 10;

  useEffect(() => {
    if (!authKey) navigate('/authenticate');
  }, [authKey, navigate]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAPI('GET', '/blog_posts', null, authKey);
      if (res.status && res.status !== 200) throw new Error(res.message || `Error ${res.status}`);
      
      const posts = Array.isArray(res) ? res : res.body;
      if (!Array.isArray(posts)) throw new Error('Unexpected data format');

      const sorted = posts.slice().sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return b.id - a.id;
      });

      setBlogPosts(sorted);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authKey) {
      fetchPosts();
    }
  }, [authKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const newPost = { subject, content, user_id: user.id };
    
    try {
      const response = await fetchAPI('POST', '/blog_posts', newPost, authKey);
      const postId = response && response.body && response.body.id 
        ? response.body.id 
        : (response && response.id ? response.id : Date.now());
      
      const createdPost = {
        id: postId,
        user_id: user.id,
        subject,
        content,
        user: {
          first_name: user.first_name || user.username || 'Current',
          last_name: user.last_name || ''
        },
        
      };
      
      setBlogPosts(prev => [createdPost, ...prev]);
      setSubject('');
      setContent('');
      
      console.log('Post created successfully with ID:', postId);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Error creating post: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const response = await fetchAPI('DELETE', `/blog_posts/${id}`, null, authKey);
      if (response) setBlogPosts(prev => prev.filter(post => post.id !== id));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post: ' + (err.message || 'Unknown error'));
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
                <span className="font-semibold text-gray-700">User:</span> {post.user.first_name} {post.user.last_name}
              </p>
            )}
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Subject:</span> {post.subject}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Content:</span> {post.content}
            </p>
            {post.created_at && (
              <p className="text-xs text-gray-500">
                Posted: {new Date(post.created_at).toLocaleString()}
              </p>
            )}
          </div>
          {(user && (user.id === post.user_id || user.role === 'admin')) && (
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
  };

  return (
    <div className="text-white min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex flex-col flex-1">
        <h1 className="text-2xl font-bold text-center mb-6">Blog Posts</h1>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="card bg-white text-black shadow-lg mb-6">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  id="subject"
                  type="text"
                  className="input input-bordered bg-white text-black w-full"
                  placeholder="Enter Subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
                <p className={`mt-1 text-sm ${subjectValid ? 'text-green-600' : 'text-red-600'}`}>
                  {subjectValid ? `${subject.trim().length} / 3–100 chars` : `Subject must be 3–100 chars (${subject.trim().length})`}
                </p>
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
                <p className={`mt-1 text-sm ${contentValid ? 'text-green-600' : 'text-red-600'}`}>
                  {contentValid ? `${content.trim().length} / 10+ chars` : `Content must be at least 10 chars (${content.trim().length})`}
                </p>
              </div>

              <div className="flex justify-between mt-4">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => { setSubject(''); setContent(''); }}
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!(subjectValid && contentValid) || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Create New Blog Post'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {isLoading && blogPosts.length === 0 ? (
            <p className="text-center text-lg mt-4 text-gray-300">Loading blog posts...</p>
          ) : blogPosts.length > 0 ? (
            blogPosts.map(renderBlogPost)
          ) : (
            <p className="text-center text-lg mt-4 text-gray-300">No blog posts available.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default BlogPostView;