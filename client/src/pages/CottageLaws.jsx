import { AlertTriangle, CheckCircle, XCircle, FileText, Link as LinkIcon } from 'lucide-react'

export default function CottageLaws() {
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-ink mb-2">Cottage Laws</h1>
        <p className="text-slate-600 mb-8">Tennessee Food Freedom Act — What You Need to Know</p>

        {/* Disclaimer */}
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Important Disclaimer</p>
            <p className="text-sm text-amber-800">
              This information is for reference only and does not constitute legal advice. Cottage food laws change frequently. <strong>Always verify current requirements with the Tennessee Department of Agriculture before selling any products.</strong> Using Krystle's Cottage does not guarantee legal compliance — you are responsible for following all applicable state and local regulations.
            </p>
          </div>
        </div>

        {/* Key Facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="card p-5 bg-moss-50 border border-moss-200">
            <p className="text-sm text-slate-600 uppercase tracking-wider font-semibold mb-1">License</p>
            <p className="text-2xl font-bold text-moss-700">Not Needed</p>
            <p className="text-xs text-slate-500 mt-2">No permit, registration, or inspection required</p>
          </div>
          <div className="card p-5 bg-moss-50 border border-moss-200">
            <p className="text-sm text-slate-600 uppercase tracking-wider font-semibold mb-1">Sales Cap</p>
            <p className="text-2xl font-bold text-moss-700">Unlimited</p>
            <p className="text-xs text-slate-500 mt-2">No income or production limits</p>
          </div>
          <div className="card p-5 bg-moss-50 border border-moss-200">
            <p className="text-sm text-slate-600 uppercase tracking-wider font-semibold mb-1">Cost</p>
            <p className="text-2xl font-bold text-moss-700">$0</p>
            <p className="text-xs text-slate-500 mt-2">No fees, no training mandated</p>
          </div>
        </div>

        {/* Allowed Foods */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
            <CheckCircle size={24} className="text-moss-600" />
            Allowed Foods
          </h2>
          <div className="space-y-2 ml-8">
            <p className="text-slate-700"><strong>Baked Goods:</strong> Breads, cookies, cakes, pies (including cream pies, cheesecakes, cream-filled pastries)</p>
            <p className="text-slate-700"><strong>Sweets:</strong> Candies, fudge, chocolates</p>
            <p className="text-slate-700"><strong>Preserves & Sauces:</strong> Jams, jellies, preserves, marmalades, fruit butters, applesauce, chutneys</p>
            <p className="text-slate-700"><strong>Pickled & Canned:</strong> Pickles, fermented vegetables, acidified foods, low-acid canned foods, hot sauces (Tennessee is one of only ~3 states allowing this)</p>
            <p className="text-slate-700"><strong>Dried & Nuts:</strong> Dried fruits, granola, roasted nuts, nut butters</p>
            <p className="text-slate-700"><strong>Other:</strong> Honey, maple syrup, spice mixes, coffee, tea blends</p>
            <p className="text-slate-700"><strong>Dairy (as of July 1, 2025):</strong> Pasteurized butter, yogurt, hard cheese, kefir, eggs</p>
            <p className="text-slate-700"><strong>Poultry (as of July 1, 2025):</strong> Rotisserie chicken, poultry soups, pot pies under federal 1,000-bird exemption or using inspected poultry (max 75 lb per transaction)</p>
          </div>
        </section>

        {/* Prohibited Foods */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
            <XCircle size={24} className="text-red-600" />
            Prohibited Foods
          </h2>
          <div className="space-y-2 ml-8">
            <p className="text-slate-700"><strong>Raw Dairy:</strong> Unpasteurized (raw) milk and raw-dairy products</p>
            <p className="text-slate-700"><strong>Red Meat:</strong> Beef, pork, lamb, and meat byproducts</p>
            <p className="text-slate-700"><strong>Seafood:</strong> Fish and shellfish</p>
            <p className="text-slate-700"><strong>Alcoholic Beverages:</strong> Beer, wine, spirits, etc.</p>
            <p className="text-slate-700"><strong>Cannabis/THC:</strong> Cannabis-infused or THC products of any kind</p>
          </div>
        </section>

        {/* Labeling Requirements */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
            <FileText size={24} className="text-terra-600" />
            Labeling Requirements
          </h2>
          <div className="card p-5 bg-terra-50 border border-terra-200 mb-4">
            <p className="font-semibold text-terra-900 mb-3">All products must include this disclaimer (verbatim):</p>
            <p className="italic text-sm text-terra-800 bg-white p-3 rounded border-l-4 border-terra-600">
              "This product was produced at a private residence that is exempt from state licensing and inspection. This product may contain allergens."
            </p>
          </div>
          <div className="space-y-3 ml-4">
            <p className="text-slate-700"><strong>Display Location:</strong> On the package label (if packaged), on a placard at point of sale (if unpackaged), on your webpage (if sold online), or disclosed orally for phone/custom orders</p>
            <p className="text-slate-700"><strong>Best Practice:</strong> Include producer name, ingredients list, and net weight on all labels for transparency and customer trust</p>
            <p className="text-slate-700"><strong>Note:</strong> Tennessee does not mandate other label elements beyond the disclaimer, but clear labeling builds customer confidence and protects you legally</p>
          </div>
        </section>

        {/* Sales & Distribution */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4">Sales & Distribution</h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-moss-700 mb-1">✓ What's Allowed</p>
              <ul className="ml-4 space-y-1 text-slate-700">
                <li>• Direct-to-consumer sales (farmers markets, farm stands, pop-ups)</li>
                <li>• Online sales within Tennessee (own website, social media, Etsy)</li>
                <li>• Wholesale to retail stores, co-ops, gift shops, specialty food shops for non-perishable items</li>
                <li>• In-state shipping and delivery</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-red-700 mb-1">✕ What's NOT Allowed</p>
              <ul className="ml-4 space-y-1 text-slate-700">
                <li>• Out-of-state (interstate) shipping</li>
                <li>• Selling perishable (TCS) foods to restaurants for resale in their dishes</li>
                <li>• Shipping perishable foods at all (they can only be sold in-person)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Using Krystle's Cottage */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4">Using Krystle's Cottage for Your Business</h2>
          <div className="card p-5 bg-slate-50 border border-slate-200">
            <p className="text-slate-700 mb-3">Krystle's Cottage provides tools to manage your recipes, inventory, and group shared meals. However:</p>
            <ul className="ml-4 space-y-2 text-slate-700">
              <li>• <strong>Compliance is your responsibility.</strong> Use this app to stay organized, but always verify you're following state and local regulations.</li>
              <li>• <strong>Label correctly.</strong> The app can help you track ingredients, but you must print and apply the required cottage food disclaimer to all packaged products.</li>
              <li>• <strong>Track sales accurately.</strong> While Tennessee has no income cap, keep records of what you produce and sell for personal accountability.</li>
              <li>• <strong>Understand your inventory.</strong> Use the Pantry to track what you have — if a product has a "use by" date, respect it to avoid selling expired items.</li>
              <li>• <strong>Consider insurance.</strong> Even with the TFFA exemption, product liability insurance protects you if a customer reports an issue.</li>
            </ul>
          </div>
        </section>

        {/* Official Resources */}
        <section className="mb-10">
          <h2 className="text-2xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
            <LinkIcon size={24} className="text-moss-600" />
            Official Sources
          </h2>
          <p className="text-slate-600 mb-4">Verify all requirements directly with the state:</p>
          <div className="space-y-3">
            <a href="https://www.tn.gov/agriculture/consumers/food-safety/tennessee-food-freedom-act.html" target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
              <p className="font-semibold text-moss-700 flex items-center gap-2">
                Tennessee Department of Agriculture <LinkIcon size={16} />
              </p>
              <p className="text-sm text-slate-600">Official TFFA guidance and resources</p>
            </a>
            <a href="https://www.cottagefoodlicense.com/state/tennessee" target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
              <p className="font-semibold text-moss-700 flex items-center gap-2">
                Cottage Food License — Tennessee Guide <LinkIcon size={16} />
              </p>
              <p className="text-sm text-slate-600">Detailed regulations, labeling templates, and FAQs</p>
            </a>
          </div>
        </section>

        {/* Final Note */}
        <div className="p-5 bg-cream border border-slate-200 rounded-xl">
          <p className="text-sm text-slate-700">
            <strong>Last updated:</strong> April 2026. Tennessee cottage food laws change periodically. Check the official sources above before starting or expanding your food business.
          </p>
        </div>
      </div>
    </div>
  )
}
