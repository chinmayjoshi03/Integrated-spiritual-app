import { useState, type ChangeEvent, type FormEvent } from 'react';

import {
  createCommunityGroup,
  uploadCommunityBanner,
} from '../services/communityService';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';

interface CreateCommunityFormProps {
  onCreated: () => void;
}

const CreateCommunityForm = ({ onCreated }: CreateCommunityFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleBanner = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const url = await uploadCommunityBanner(file);
      setBannerUrl(url);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to upload this image.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createCommunityGroup({
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        banner_url: bannerUrl || undefined,
      });
      setSuccess('Community created.');
      setName('');
      setDescription('');
      setCategory('');
      setBannerUrl('');
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create this community.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="community-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2 className="community-section-title">Create community</h2>
      <p className="community-section-copy">
        Start a circle. It becomes available immediately — no approval needed.
      </p>
      <label className="community-label" htmlFor="community-name">
        Name
      </label>
      <input
        id="community-name"
        className="community-input"
        value={name}
        maxLength={200}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
      />
      <label className="community-label" htmlFor="community-category">
        Category
      </label>
      <input
        id="community-category"
        className="community-input"
        value={category}
        maxLength={80}
        onChange={(e) => setCategory(e.target.value)}
        disabled={submitting}
      />
      <label className="community-label" htmlFor="community-description">
        Description
      </label>
      <textarea
        id="community-description"
        className="community-textarea"
        value={description}
        maxLength={2000}
        onChange={(e) => setDescription(e.target.value)}
        disabled={submitting}
      />
      <label className="community-label" htmlFor="community-banner">
        Community image
      </label>
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="community-banner-preview" />
      ) : null}
      <input
        id="community-banner"
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={(e) => {
          void handleBanner(e);
        }}
        disabled={submitting || uploading}
      />
      {uploading ? <p className="community-section-copy">Uploading image...</p> : null}
      {error ? <p className="community-error">{error}</p> : null}
      {success ? <p className="community-success">{success}</p> : null}
      <button type="submit" className="community-primary-btn" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create community'}
      </button>
    </form>
  );
};

export default CreateCommunityForm;
