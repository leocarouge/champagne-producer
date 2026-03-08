import Image from 'next/image'
import Link from 'next/link'
import { Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { Room } from '@/types'

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <div className="group bg-white border border-zinc-100 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Images */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {room.photos[0] ? (
          <Image
            src={room.photos[0]}
            alt={room.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-zinc-100" />
        )}
        {room.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{room.photos.length - 1} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-serif text-xl font-semibold text-zinc-900 group-hover:text-[#C9A84C] transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center gap-1 text-zinc-500 text-sm shrink-0">
            <Users className="w-4 h-4" />
            <span>{room.capacity}</span>
          </div>
        </div>

        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 mb-4">
          {room.description}
        </p>

        {/* Amenities */}
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="text-[10px] bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-[10px] text-zinc-400">+{room.amenities.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-serif text-2xl font-semibold text-[#C9A84C]">
              {formatPrice(room.price_per_night)}
            </span>
            <span className="text-zinc-400 text-sm"> / nuit</span>
          </div>
          <Button asChild>
            <Link href={`/chambres/${room.slug}`}>Réserver</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
