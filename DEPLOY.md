# Deployment Instructions

## Quick Deploy to Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Build the project: `npm run build`
3. Deploy: `vercel --prod`
4. Share the URL with your team

## Alternative: Netlify

1. Build: `npm run build`
2. Drag the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)
3. Share the generated URL

## For Team Members

Once deployed, team members can:
1. Visit the calculator URL
2. Enter their weekly/monthly metrics
3. Click "💾 Salvar Cálculo" to save locally
4. Click "📊 Exportar CSV" to download data for Google Sheets
5. Import the CSV file into your shared Google Sheet

## Google Sheets Integration

The CSV export includes all calculation history with these columns:
- Data, Hora, Orçamento, Qtd Leads, CPL, etc.
- Status indicators for each target metric

Simply import the CSV into your shared Google Sheet using:
**File → Import → Upload → Replace data**