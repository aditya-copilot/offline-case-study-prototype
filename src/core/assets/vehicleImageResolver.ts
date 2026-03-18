import type { Vehicle, ResolvedImage, ImageResolverConfig, ImagePreloadQueue } from '@core/types/vehicles';

const DEFAULT_CONFIG: ImageResolverConfig = {
  basePath: '/src/assets/images/bikes',
  fallbackImage: '/src/assets/images/bikes/fallback-bike.png',
  supportedFormats: ['.png', '.jpg', '.jpeg', '.webp', '.avif'],
  lazyLoadThreshold: 200,
  preloadHeroCount: 5
};

const vehicleImageMap: Record<string, string> = {
  'yamaha-r15-v4': 'yamaha-select-model-racing-bluedisc-1679658670747.png',
  'yamaha-mt-15-v2': 'yamaha-select-model-dark-matte-bluedisc-1712697978913.png',
  'honda-sp-125': 'honda-sp-125--honda-sp-125-0.jpeg',
  'honda-shine-100': 'honda-shine-100-front-view14.jpeg',
  'hero-xpulse-200': 'hero-xpulse-200-right-front-three-quarter0.jpeg',
  'ktm-duke-390': 'duke-390-right-side-view-14.png',
  'royal-enfield-continental-gt': 'continental-gt-right-side-view-12.png',
  'tvs-apache-rr-310': 'tvs-apache-rr-310-right-side-view62.jpeg',
  'jawa-42-bobber': 'jawa-42-bobber-thumbnail18.jpeg',
  'vespa-sxl-150': 'vespa-sxl-150-videothumbnail149.jpeg',
  'tvs-ntorq-125': 'ntorq-125-right-side-view-3.png',
  'hero-xtreme-200s': 'xtreme-200s-right-front-three-quarter.png',
  'honda-unicorn': 'unicorn-right-side-view-2.png',
  'bajaj-pulsar-ns200': 'front-view6.jpeg',
  'suzuki-gixxer-sf': 'v1-right-front-three-quarter-8.jpeg'
};

const brandLogos: Record<string, string> = {
  'Yamaha': 'yamaha-logo.png',
  'Honda': 'honda-logo.png',
  'Hero': 'hero-logo.png',
  'TVS': 'tvs-logo.png',
  'Bajaj': 'bajaj-logo.png',
  'Royal Enfield': 're-logo.png',
  'KTM': 'ktm-logo.png',
  'Suzuki': 'suzuki-logo.png',
  'Jawa': 'jawa-logo.png',
  'Vespa': 'vespa-logo.png'
};

class VehicleImageResolver {
  private config: ImageResolverConfig;
  private preloadedImages: Set<string> = new Set();
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingQueue: Map<string, Promise<HTMLImageElement>> = new Map();

  constructor(config: Partial<ImageResolverConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  resolveImage(vehicle: Vehicle, options: {
    variant?: 'main' | 'thumbnail' | 'hero' | 'detail';
    colorId?: number;
    fallback?: boolean;
  } = {}): ResolvedImage {
    const { variant = 'main', colorId, fallback = true } = options;

    const imagePath = this.findImageForVehicle(vehicle, colorId);
    const isFallback = !imagePath && fallback;
    const finalPath = imagePath || this.config.fallbackImage;

    return {
      src: `${this.config.basePath}/${finalPath}`,
      alt: `${vehicle.makeName} ${vehicle.modelName} ${vehicle.vehicleType}`,
      width: this.getWidthForVariant(variant),
      height: this.getHeightForVariant(variant),
      isFallback,
      loading: variant === 'hero' ? 'eager' : 'lazy'
    };
  }

  resolveVariantImage(vehicle: Vehicle, variantId: number): ResolvedImage {
    const variant = vehicle.variants.find((v) => v.id === variantId);
    const colorImage = variant?.colors[0]?.imagePath;

    if (colorImage) {
      const fileName = colorImage.split('/').pop();
      if (fileName) {
        return {
          src: `${this.config.basePath}/${fileName}`,
          alt: `${vehicle.name} - ${variant.name}`,
          isFallback: false,
          loading: 'lazy'
        };
      }
    }

    return this.resolveImage(vehicle);
  }

  resolveColorImage(vehicle: Vehicle, colorId: number): ResolvedImage {
    const color = vehicle.colors.find((c) => c.id === colorId);

    if (color?.imagePath) {
      const fileName = color.imagePath.split('/').pop();
      if (fileName) {
        return {
          src: `${this.config.basePath}/${fileName}`,
          alt: `${vehicle.name} - ${color.name}`,
          isFallback: false,
          loading: 'lazy'
        };
      }
    }

    return this.resolveImage(vehicle);
  }

  resolveBrandLogo(makeName: string): string {
    const logoFile = brandLogos[makeName];
    if (logoFile) {
      return `${this.config.basePath}/brands/${logoFile}`;
    }
    return `${this.config.basePath}/brands/default-logo.png`;
  }

  private findImageForVehicle(vehicle: Vehicle, colorId?: number): string | null {
    if (colorId) {
      const colorImage = this.resolveColorImage(vehicle, colorId);
      if (!colorImage.isFallback) {
        return colorImage.src.replace(`${this.config.basePath}/`, '');
      }
    }

    const mappedImage = vehicleImageMap[vehicle.id];
    if (mappedImage) {
      return mappedImage;
    }

    const modelImage = vehicle.imagePath?.split('/').pop();
    if (modelImage && this.isSupportedFormat(modelImage)) {
      return modelImage;
    }

    const makePrefix = vehicle.makeName.toLowerCase().replace(/\s+/g, '-');
    const modelPrefix = vehicle.modelName.toLowerCase().replace(/\s+/g, '-');
    const possibleNames = [
      `${makePrefix}-${modelPrefix}.png`,
      `${makePrefix}-${modelPrefix}.jpg`,
      `${makePrefix}-select-model-default.png`,
      `${modelPrefix}-right-side-view.png`
    ];

    return possibleNames[0] || null;
  }

  private isSupportedFormat(fileName: string): boolean {
    return this.config.supportedFormats.some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );
  }

  private getWidthForVariant(variant: string): number {
    switch (variant) {
      case 'thumbnail': return 150;
      case 'main': return 400;
      case 'hero': return 800;
      case 'detail': return 1200;
      default: return 400;
    }
  }

  private getHeightForVariant(variant: string): number {
    switch (variant) {
      case 'thumbnail': return 100;
      case 'main': return 300;
      case 'hero': return 600;
      case 'detail': return 800;
      default: return 300;
    }
  }

  async preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.preloadedImages.has(src)) {
      return this.imageCache.get(src) as HTMLImageElement;
    }

    if (this.loadingQueue.has(src)) {
      return this.loadingQueue.get(src) as Promise<HTMLImageElement>;
    }

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        this.imageCache.set(src, img);
        this.loadingQueue.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingQueue.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });

    this.loadingQueue.set(src, loadPromise);
    return loadPromise;
  }

  async preloadHeroVehicles(vehicles: Vehicle[]): Promise<void> {
    const heroVehicles = vehicles.slice(0, this.config.preloadHeroCount);
    const preloadPromises = heroVehicles.map((vehicle) => {
      const image = this.resolveImage(vehicle, { variant: 'hero' });
      return this.preloadImage(image.src).catch(() => null);
    });

    await Promise.all(preloadPromises);
  }

  async preloadQueue(queue: ImagePreloadQueue): Promise<void> {
    const { vehicleIds, onProgress } = queue;
    let loaded = 0;

    for (const vehicleId of vehicleIds) {
      try {
        await this.preloadImage(`${this.config.basePath}/${vehicleId}`);
        loaded++;
        onProgress?.(loaded, vehicleIds.length);
      } catch {
        loaded++;
      }
    }
  }

  createLazyLoader(threshold: number = this.config.lazyLoadThreshold) {
    if (!('IntersectionObserver' in window)) {
      return {
        observe: () => {},
        unobserve: () => {}
      };
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            this.preloadImage(src)
              .then(() => {
                img.src = src;
                img.removeAttribute('data-src');
              })
              .catch(() => {
                img.src = this.config.fallbackImage;
              });
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: `${threshold}px`,
      threshold: 0.01
    });

    return {
      observe: (element: Element) => imageObserver.observe(element),
      unobserve: (element: Element) => imageObserver.unobserve(element)
    };
  }

  generateSrcSet(vehicle: Vehicle): string {
    const widths = [150, 300, 600, 800, 1200];
    const srcSet = widths.map((width) => {
      const image = this.resolveImage(vehicle);
      return `${image.src} ${width}w`;
    });
    return srcSet.join(', ');
  }

  clearCache(): void {
    this.preloadedImages.clear();
    this.imageCache.clear();
    this.loadingQueue.clear();
  }

  getCacheStats(): { cached: number; loading: number } {
    return {
      cached: this.imageCache.size,
      loading: this.loadingQueue.size
    };
  }
}

export const vehicleImageResolver = new VehicleImageResolver();
export { VehicleImageResolver };
