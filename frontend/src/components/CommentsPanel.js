import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  MessageSquareIcon, 
  SendIcon, 
  CheckIcon, 
  ReplyIcon,
  MoreHorizontalIcon,
  PlusIcon
} from 'lucide-react';

const CommentsPanel = ({ comments, onAddComment, pageContent }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment('block1', newComment.trim(), user.id); // Mock block ID
      setNewComment('');
    }
  };

  const handleSubmitReply = (commentId) => {
    if (replyText.trim()) {
      // Mock reply functionality
      console.log('Reply to', commentId, ':', replyText);
      setReplyingTo(null);
      setReplyText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquareIcon className="h-5 w-5 text-gray-500" />
            <h2 className="font-medium">Comments</h2>
            <Badge variant="secondary" className="text-xs">
              {comments.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquareIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Start a conversation about this page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.resolved && (
                        <Badge variant="outline" className="text-xs">
                          <CheckIcon className="h-2 w-2 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{comment.content}</p>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <ReplyIcon className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        {comment.resolved ? 'Unresolve' : 'Resolve'}
                      </Button>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 ml-4">
                        <div className="flex space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="min-h-[60px] text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  handleSubmitReply(comment.id);
                                }
                              }}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                Press ⌘ + Enter to reply
                              </p>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setReplyingTo(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={!replyText.trim()}
                                >
                                  <SendIcon className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* New Comment Form */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px] text-sm"
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Press ⌘ + Enter to comment
              </p>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <SendIcon className="h-4 w-4 mr-1" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;