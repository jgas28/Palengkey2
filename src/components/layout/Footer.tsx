import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { Logo } from "@/components/layout/Header";
import { useToastStore } from "@/stores/toastStore";

export default function Footer() {
  const showToast = useToastStore((state) => state.showToast);

  // There's no mailing-list backend yet — say so rather than pretend to subscribe.
  function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    showToast("Newsletter sign-up is coming soon. Salamat!", "info");
  }

  return (
    <footer id="about">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            Ang paboritong palengke mo, online. Fresh market goods, thoughtfully picked and
            delivered.
          </p>
          <address className="footer-address">
            <span>
              <Icon name="pin" size={15} />
              Block 3 Lot 106 Lawang Pari, San Jose Del Monte, Bulacan 3023
            </span>
            <a href="mailto:contact@palengkey.ph">
              <Icon name="message" size={15} />
              contact@palengkey.ph
            </a>
          </address>
          <div className="socials" aria-label="Social media">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Palengkey on Facebook"
            >
              <Icon name="facebook" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Palengkey on Instagram"
            >
              <Icon name="instagram" />
            </a>
          </div>
          <div className="store-badges">
            <span>
              <small>COMING SOON ON</small>App Store
            </span>
            <span>
              <small>COMING SOON ON</small>Google Play
            </span>
          </div>
        </div>
        <div>
          <h3>Palengkey</h3>
          <Link to="/about">About us</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/paluto">Paluto</Link>
          <Link to="/recipes">Recipes</Link>
          <Link to="/careers">Careers</Link>
        </div>
        <div>
          <h3>Support</h3>
          <Link to="/faq">Help center</Link>
          <Link to="/orders">Track an order</Link>
          <Link to="/delivery-areas">Delivery information</Link>
          <a href="mailto:support@palengkey.ph">Contact us</a>
        </div>
        <div>
          <h3>Stay in the loop</h3>
          <p>Fresh deals and market stories, straight to your inbox.</p>
          <form className="footer-form" onSubmit={handleSubscribe}>
            <input type="email" aria-label="Email address" placeholder="Your email address" />
            <button type="submit" aria-label="Subscribe" className="btn submit">
              <Icon name="arrow" />
            </button>
          </form>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Palengkey. Made fresh in the Philippines.</span>
        <div>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-of-service">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
