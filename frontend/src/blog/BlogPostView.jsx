import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api.mjs';
import { useAuthenticate } from '../authentication/useAuthenticate';

function BlogPosts({ initialPosts = [], currentUser }) {
  const [blogPosts, setBlogPosts] = useState(initialPosts);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchAPI("GET", "/api/blog_posts")
      .then(res => setBlogPosts(res.body))
      .catch(err => console.error("Failed to load posts", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPost = { subject, content };
    try {
      const res = await fetch('/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        const created = await res.json();
        setBlogPosts([created, ...blogPosts]);
        setSubject('');
        setContent('');
      } else console.error('Failed to create post');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`/blog/delete-blog-post/${id}`, { method: 'POST' });
      if (res.ok) setBlogPosts(blogPosts.filter(p => p.blog_post.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="text-white min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex flex-col flex-1">
        <h1 className="text-3xl font-bold text-center mb-6">Blog Posts</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="card bg-white text-black shadow-lg flex-1">
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

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
            {blogPosts.length > 0 ? (
              blogPosts.map(blog_post => (
                <div className="card bg-white text-black shadow-md" key={blog_post.blog_post.id}>
                  <div className="card-body flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">User:</span> {blog_post.user.first_name} {blog_post.user.last_name}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Subject:</span> {blog_post.blog_post.subject}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">Content:</span> {blog_post.blog_post.content}
                      </p>
                    </div>
                    {(currentUser && (currentUser.id === blog_post.blog_post.user_id || currentUser.role === 'admin')) && (
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => handleDelete(blog_post.blog_post.id)}
                        aria-label="Delete post"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </div>
              ))
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