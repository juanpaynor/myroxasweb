# MyRoxas Hero Image Assets

## Upload Your Hero Image Here

Place your MyRoxas hero image (the one with the woman holding the phone showing the app) as:

```
myroxas-hero.jpg
```

### Requirements:
- **Format**: JPG, PNG, or WebP
- **Aspect Ratio**: 4:5 (portrait orientation)
- **Resolution**: Minimum 800x1000px (recommended 1200x1500px for crisp display)
- **File Size**: Under 2MB for optimal loading

### To Activate:
1. Upload your image to this folder
2. Name it `myroxas-hero.jpg`
3. In `/src/components/hero.tsx`, uncomment the Image component (around line 180)
4. Comment out or remove the placeholder div

### Optional Background Image:
You can also add a blurred Roxas City skyline image as:
```
roxas-city-skyline.jpg
```

Then uncomment the background div in the hero component for a subtle city backdrop.

### Current Setup:
- ✅ Hero component with animations ready
- ✅ Framer Motion installed for smooth effects
- ✅ Responsive design (mobile + desktop)
- ✅ App store buttons styled
- ⏳ Waiting for your hero image upload