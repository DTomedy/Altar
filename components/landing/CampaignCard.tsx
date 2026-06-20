import Link from 'next/link';
import Image from 'next/image';
import { Gift, Users } from 'lucide-react';
import { formatNaira } from '@/lib/formatters';

interface CampaignCardProps {
  slug: string;
  title: string;
  coverPhoto: string | null;
  goalAmount: number | null;
  totalRaised: number;
  donorCount: number;
}

export function CampaignCard({
  slug,
  title,
  coverPhoto,
  goalAmount,
  totalRaised,
  donorCount,
}: CampaignCardProps) {
  const percentage = goalAmount && goalAmount > 0
    ? Math.min(Math.round((totalRaised / goalAmount) * 100), 100)
    : 0;

  return (
    <Link href={`/c/${slug}`}>
      <div className="bg-surface border border-gray-200 rounded-2xl overflow-hidden hover:border-primary transition-colors h-full flex flex-col">
        <div className="relative w-full h-48 bg-surface-muted">
          {coverPhoto ? (
            <Image
              src={coverPhoto}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="w-12 h-12 text-accent" />
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display font-medium text-base text-body line-clamp-2 mb-3">
            {title}
          </h3>

          {goalAmount && goalAmount > 0 ? (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-medium text-base text-primary">
                  {formatNaira(totalRaised)}
                </span>
                <span className="font-body text-xs text-body/70">
                  {formatNaira(goalAmount)}
                </span>
              </div>
              <div className="w-full bg-surface-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="font-body text-xs text-body/50 mt-1 block">
                {percentage}% funded
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="font-display font-medium text-base text-primary">
                {formatNaira(totalRaised)}
              </span>
              <span className="font-body text-xs text-body/50 ml-2">raised</span>
            </div>
          )}

          <div className="mt-auto flex items-center gap-1 text-body/70">
            <Users className="w-4 h-4" />
            <span className="font-body text-xs">
              {donorCount} donor{donorCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
