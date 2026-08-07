#!/usr/bin/env node

/**
 * add-animation-ref.js
 * Automation tool to extract animation references from URLs/repos and organize them into the recipe
 * Usage: node add-animation-ref.js <url> [--type=library|site|docs]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RECIPE_ROOT = path.dirname(path.dirname(__dirname));

// URL type detection patterns
const PATTERNS = {
  github: /github\.com\/([^/]+)\/([^/]+)/,
  awwwards: /(awwwards\.com|dribbble\.com|behance\.net)/,
  npmjs: /npmjs\.com\/package\//,
  officialDocs: /(motion\.dev|greensock\.com|gsap-skills|framer\.com)/,
  portfolioSite: /^https?:\/\/([a-z0-9-]+\.)*(dev|com|net|org|io|co).*/, // Catch-all for portfolio sites
};

class AnimationRefAutomation {
  constructor(url) {
    this.url = url;
    this.type = null;
    this.metadata = {};
  }

  detectType() {
    if (PATTERNS.github.test(this.url)) {
      this.type = 'github';
      const match = this.url.match(PATTERNS.github);
      this.metadata.owner = match[1];
      this.metadata.repo = match[2];
    } else if (PATTERNS.officialDocs.test(this.url)) {
      this.type = 'official-docs';
      this.metadata.siteName = this.extractSiteName(this.url);
    } else if (PATTERNS.awwwards.test(this.url)) {
      this.type = 'awwwards';
      this.metadata.siteName = this.extractSiteName(this.url);
    } else if (PATTERNS.npmjs.test(this.url)) {
      this.type = 'npm';
      this.metadata.packageName = this.extractPackageName(this.url);
    } else if (PATTERNS.portfolioSite.test(this.url)) {
      this.type = 'portfolio-site';
      this.metadata.siteName = this.extractSiteName(this.url);
    } else {
      this.type = 'unknown';
    }
    return this.type;
  }

  extractSiteName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'unknown-site';
    }
  }

  extractPackageName(url) {
    const match = url.match(/npmjs\.com\/package\/([^/]+)/);
    return match ? match[1] : 'unknown-package';
  }

  async generateMetadata() {
    const timestamp = new Date().toISOString();
    const metadata = {
      url: this.url,
      type: this.type,
      addedAt: timestamp,
      reviewed: false,
      ...this.metadata,
    };
    return metadata;
  }

  createMarkdownContent(metadata) {
    let content = `# ${metadata.siteName || metadata.repo || metadata.packageName || 'Animation Reference'}\n\n`;

    content += `**Source:** [${this.url}](${this.url})\n\n`;
    content += `**Type:** ${metadata.type}\n\n`;
    content += `**Added:** ${metadata.addedAt}\n\n`;
    content += `**Status:** Pending review\n\n`;

    content += `## Animations Observed\n\n`;
    content += `- [ ] Entrance animations\n`;
    content += `- [ ] Scroll-triggered animations\n`;
    content += `- [ ] Hover/interaction animations\n`;
    content += `- [ ] Layout transitions\n\n`;

    content += `## Extract Pattern\n\n`;
    content += `**Instructions for extraction:**\n`;
    content += `1. Visit the site/repo\n`;
    content += `2. Inspect animations with browser devtools\n`;
    content += `3. Extract CSS/JS code snippets\n`;
    content += `4. Document patterns and gotchas\n`;
    content += `5. Categorize by library (GSAP, Framer Motion, etc)\n\n`;

    content += `## Notes\n\n`;
    content += `Add observations, library used, and any gotchas here.\n\n`;

    content += `## Code Snippets\n\n`;
    content += `Reference links to specific files or examples:\n\n`;
    content += `\`\`\`\n`;
    content += `// Add extracted code references or links here\n`;
    content += `\`\`\`\n\n`;

    content += `## Related Patterns\n\n`;
    content += `- Link to related recipe patterns\n`;
    content += `- Link to library documentation\n`;

    return content;
  }

  ensureLibraryDirectory(libraryName) {
    const libPath = path.join(RECIPE_ROOT, 'libraries', libraryName);
    if (!fs.existsSync(libPath)) {
      fs.mkdirSync(libPath, { recursive: true });
      console.log(`✓ Created library directory: ${libPath}`);
    }
    return libPath;
  }

  saveReference(metadata) {
    let outputPath;
    let fileName;

    if (this.type === 'github') {
      // For GitHub repos, infer library type from repo name
      const repoName = metadata.repo.toLowerCase();
      let libraryName = 'unknown-library';

      if (repoName.includes('gsap')) libraryName = 'gsap';
      else if (repoName.includes('framer') || repoName.includes('motion')) libraryName = 'framer-motion';
      else if (repoName.includes('three') || repoName.includes('babylon')) libraryName = 'three-js';
      else libraryName = repoName.replace('-', '_');

      const libPath = this.ensureLibraryDirectory(libraryName);
      fileName = `${metadata.owner}-${metadata.repo}.md`;
      outputPath = path.join(libPath, fileName);
    } else if (this.type === 'awwwards' || this.type === 'portfolio-site') {
      const awwardsPath = path.join(RECIPE_ROOT, 'awwwards-refs');
      fs.mkdirSync(awwardsPath, { recursive: true });
      fileName = `${metadata.siteName}.md`;
      outputPath = path.join(awwardsPath, fileName);
    } else if (this.type === 'official-docs') {
      const refPath = path.join(RECIPE_ROOT, '_core', 'references');
      fs.mkdirSync(refPath, { recursive: true });
      fileName = `${metadata.siteName}.md`;
      outputPath = path.join(refPath, fileName);
    } else {
      const refPath = path.join(RECIPE_ROOT, '_core');
      fs.mkdirSync(refPath, { recursive: true });
      fileName = `${this.type}-reference.md`;
      outputPath = path.join(refPath, fileName);
    }

    const content = this.createMarkdownContent(metadata);
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✓ Created reference file: ${outputPath}`);

    return { outputPath, fileName, content };
  }

  updateGlobalReadme(metadata, relativeFilePath) {
    const readmePath = path.join(RECIPE_ROOT, 'README.md');
    let readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

    // Add status section if not present
    if (!readmeContent.includes('## 📊 Automation Status')) {
      readmeContent +=
        '\n\n## 📊 Automation Status\n\n' +
        '| Type | Count | Last Updated |\n' +
        '|------|-------|---------------|\n' +
        '| GitHub Repos | 0 | - |\n' +
        '| Awwwards Sites | 0 | - |\n' +
        '| Official Docs | 0 | - |\n';
    }

    // Add recently added section
    if (!readmeContent.includes('## 📚 Recently Added')) {
      readmeContent += '\n## 📚 Recently Added\n\n';
    }

    // Add entry to recently added
    const entry = `- [${metadata.siteName || metadata.repo || metadata.packageName}](${relativeFilePath}) - ${metadata.addedAt.split('T')[0]}\n`;
    const recentlyAddedIndex = readmeContent.indexOf('## 📚 Recently Added');
    if (recentlyAddedIndex !== -1) {
      const insertIndex = readmeContent.indexOf('\n', recentlyAddedIndex) + 1;
      readmeContent =
        readmeContent.slice(0, insertIndex) + entry + readmeContent.slice(insertIndex);
    }

    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log(`✓ Updated global README with reference`);
  }

  autoCommit(filePath, metadata) {
    try {
      const commitMessage = `add(animation-ref): ${metadata.siteName || metadata.repo || metadata.type} animation reference\n\nSource: ${this.url}\nType: ${metadata.type}\nAdded: ${metadata.addedAt}`;

      // Add file to git
      execSync(`git add "${filePath}"`, { cwd: RECIPE_ROOT });

      // Commit
      execSync(`git commit -m "${commitMessage}"`, { cwd: RECIPE_ROOT });

      console.log(`✓ Auto-committed to git`);
      return true;
    } catch (error) {
      console.warn(`⚠ Git commit failed (not critical): ${error.message}`);
      return false;
    }
  }

  async process() {
    console.log(`\n🔍 Processing animation reference: ${this.url}\n`);

    // Step 1: Detect type
    this.detectType();
    console.log(`✓ Detected type: ${this.type}`);

    // Step 2: Generate metadata
    const metadata = await this.generateMetadata();
    console.log(`✓ Generated metadata:`, metadata);

    // Step 3: Save reference
    const { outputPath, relativeFilePath } = this.saveReference(metadata);
    const relPath = path.relative(RECIPE_ROOT, outputPath);

    // Step 4: Update global README
    this.updateGlobalReadme(metadata, relPath);

    // Step 5: Auto-commit
    this.autoCommit(outputPath, metadata);

    console.log(`\n✅ Animation reference added successfully!\n`);
    console.log(`📝 File: ${relPath}`);
    console.log(`🔗 URL: ${this.url}`);
    console.log(`📋 Type: ${this.type}`);
    console.log(`\n⏳ Awaiting your review before merging.\n`);
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node add-animation-ref.js <url>');
    console.log('Example: node add-animation-ref.js https://github.com/greensock/GSAP');
    console.log('Example: node add-animation-ref.js https://www.paulkalkbrenner.net');
    process.exit(1);
  }

  const url = args[0];
  const automation = new AnimationRefAutomation(url);

  try {
    await automation.process();
  } catch (error) {
    console.error(`\n❌ Error processing animation reference:\n`, error.message);
    process.exit(1);
  }
}

main();
