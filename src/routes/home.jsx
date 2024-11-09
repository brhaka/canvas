import { Link } from "react-router-dom";
import ShareButton from '@/components/share-button.jsx';

export default function Home() {
  return (
    <div className="container min-h-screen">
      <main className="flex flex-col items-center justify-center gap-6 py-8 px-4 sm:px-6 lg:px-8">
        {/* Title and description */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Welcome to Canvas
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-[600px]">
            This is our home page.
          </p>
        </div>

        {/* Main actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Link 
            to="/canvas" 
            className="w-full sm:w-auto px-6 py-3 text-lg font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Open a canvas
          </Link>
          <ShareButton />
        </div>
      </main>
    </div>
  );
}