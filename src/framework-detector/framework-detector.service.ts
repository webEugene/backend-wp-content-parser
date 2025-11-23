import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class FrameworkDetectorService {
  async detect(url: string) {
    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);
    const scripts = this.extractScripts($);

    const detections = [];

    // ---------- Next.js ----------
    if (
      html.includes('__NEXT_DATA__') ||
      scripts.some((s) => s.includes('/_next/'))
    ) {
      detections.push({
        framework: 'Next.js',
        confidence: 1.0,
        signature: '__NEXT_DATA__',
      });
    }

    // ---------- Nuxt.js ----------
    if ($('#__nuxt').length > 0 || scripts.some((s) => s.includes('/_nuxt/'))) {
      detections.push({
        framework: 'Nuxt.js',
        confidence: 1.0,
        signature: '#__nuxt or /_nuxt/',
      });
    }

    // ---------- React (generic) ----------
    if (
      html.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__') ||
      html.includes('data-reactroot')
    ) {
      detections.push({
        framework: 'React',
        confidence: 0.9,
        signature: 'data-reactroot',
      });
    }

    // ---------- Vue ----------
    if (html.includes('data-v-app') || html.includes('data-server-rendered')) {
      detections.push({
        framework: 'Vue',
        confidence: 0.9,
        signature: 'data-v-app',
      });
    }

    // ---------- Angular (optional) ----------
    if (
      scripts.some(
        (s) =>
          s.includes('main.') &&
          s.includes('.js') &&
          html.includes('ng-version'),
      )
    ) {
      detections.push({
        framework: 'Angular',
        confidence: 0.8,
        signature: 'ng-version',
      });
    }

    // ---------- Svelte ----------
    if (
      html.includes('data-sveltekit') ||
      scripts.some((s) => s.includes('/_app/'))
    ) {
      detections.push({
        framework: 'Svelte/SvelteKit',
        confidence: 0.8,
        signature: 'data-sveltekit',
      });
    }

    if (detections.length === 0) {
      return { framework: 'Unknown', confidence: 0, signatures: [] };
    }

    // Return best match
    return detections.sort((a, b) => b.confidence - a.confidence)[0];
  }

  private async fetchHTML(url: string): Promise<string> {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (FrameworkDetectorBot)',
      },
    });
    return data;
  }

  private extractScripts($: cheerio.CheerioAPI): string[] {
    return $('script')
      .map((_, el) => $(el).attr('src') || '')
      .get()
      .filter(Boolean);
  }
}
