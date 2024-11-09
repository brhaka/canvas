import ShareButton from '@/components/share-button.jsx';

export default function Home() {
  return (
    <>
      <p>This is our home page.</p>
      <ShareButton url={window.location.origin} />
    </>
  );
}
