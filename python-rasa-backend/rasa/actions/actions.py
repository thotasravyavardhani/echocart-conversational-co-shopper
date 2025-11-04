# EchoCart Custom Actions for RASA

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
import os
from datetime import datetime

# Configuration
NEXT_API_URL = os.getenv("NEXT_API_URL", "http://localhost:3000/api")
RECOMMENDATION_API = os.getenv("RECOMMENDATION_API", "http://localhost:8001")
VISUAL_SEARCH_API = os.getenv("VISUAL_SEARCH_API", "http://localhost:8002")


class ActionRecommendProducts(Action):
    """Recommend products based on user query and mood"""

    def name(self) -> Text:
        return "action_recommend_products"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Extract entities and slots
        user_message = tracker.latest_message.get('text')
        user_id = tracker.get_slot('user_id')
        workspace_id = tracker.get_slot('workspace_id')
        mood = tracker.get_slot('current_mood')
        product_category = next(tracker.get_latest_entity_values('product_category'), None)
        price_range = next(tracker.get_latest_entity_values('price_range'), None)
        sentiment = tracker.get_slot('sentiment')
        sustainability_pref = tracker.get_slot('sustainability_preference') or 0.5

        # Build recommendation request
        recommendation_payload = {
            "query": user_message,
            "user_id": user_id,
            "workspace_id": workspace_id,
            "mood": mood,
            "sentiment": sentiment,
            "category": product_category,
            "price_range": price_range,
            "sustainability_min": sustainability_pref,
            "limit": 5
        }

        try:
            # Call recommendation service
            response = requests.post(
                f"{RECOMMENDATION_API}/recommend",
                json=recommendation_payload,
                timeout=5
            )
            response.raise_for_status()
            products = response.json().get('products', [])

            if products:
                # Format response with product cards
                message = self._format_product_response(products, mood)
                dispatcher.utter_message(text=message, json_message={"products": products})
            else:
                dispatcher.utter_message(
                    text="I couldn't find products matching your criteria. Would you like to try something different?"
                )

        except Exception as e:
            print(f"Recommendation error: {str(e)}")
            dispatcher.utter_message(
                text="I'm having trouble fetching recommendations right now. Please try again in a moment."
            )

        return []

    def _format_product_response(self, products: List[Dict], mood: str = None) -> str:
        """Format product recommendations into a narrative response"""
        
        if mood:
            mood_responses = {
                "tired": "You sound like you need comfort! Here are some cozy options:",
                "energetic": "Love the energy! Check out these dynamic choices:",
                "stressed": "Let's find something to help you unwind:",
                "excited": "Great vibes! These might match your excitement:",
                "professional": "Here are some professional options for you:",
                "casual": "Perfect for a laid-back vibe:",
            }
            intro = mood_responses.get(mood, "Here's what I found for you:")
        else:
            intro = "Check out these recommendations:"

        product_list = "\n".join([
            f"• {p['name']} - ${p['price']} ⭐ {p.get('rating', 'N/A')}"
            for p in products[:5]
        ])

        return f"{intro}\n\n{product_list}\n\nWant more details on any of these?"


class ActionTrackOrder(Action):
    """Track order status and provide narrative updates"""

    def name(self) -> Text:
        return "action_track_order"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot('order_id')
        user_id = tracker.get_slot('user_id')

        if not order_id:
            dispatcher.utter_message(
                text="I need your order number to track it. What's your order ID?"
            )
            return []

        try:
            # Call Next.js API to get order details
            response = requests.get(
                f"{NEXT_API_URL}/orders/{order_id}",
                params={"userId": user_id},
                timeout=5
            )
            response.raise_for_status()
            order = response.json()

            # Create narrative tracking update
            message = self._create_tracking_narrative(order)
            dispatcher.utter_message(text=message, json_message={"order": order})

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                dispatcher.utter_message(
                    text=f"I couldn't find an order with ID {order_id}. Please check the order number and try again."
                )
            else:
                dispatcher.utter_message(
                    text="I'm having trouble accessing order information right now. Please try again later."
                )
        except Exception as e:
            print(f"Order tracking error: {str(e)}")
            dispatcher.utter_message(
                text="Something went wrong while tracking your order. Please try again."
            )

        return []

    def _create_tracking_narrative(self, order: Dict) -> str:
        """Create a narrative-style tracking update"""
        
        status = order.get('status', 'unknown')
        tracking_data = order.get('tracking', {})
        
        narratives = {
            "processing": "Your order is being prepared at our warehouse 📦",
            "shipped": f"Great news! Your package left {tracking_data.get('origin', 'the warehouse')} "
                      f"and is on its way 🚚 Expected delivery: {tracking_data.get('eta', 'soon')}",
            "in_transit": f"Your package is currently near {tracking_data.get('current_location', 'its destination')} "
                         f"📍 Almost there!",
            "delivered": f"Delivered! Your package arrived on {tracking_data.get('delivered_at', 'today')} 🎉",
            "cancelled": "This order has been cancelled. Need help with something else?"
        }

        return narratives.get(status, f"Order status: {status}")


class ActionFilterByMood(Action):
    """Filter products based on user's mood"""

    def name(self) -> Text:
        return "action_filter_by_mood"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        mood = tracker.get_slot('current_mood')
        
        if not mood:
            mood = next(tracker.get_latest_entity_values('mood'), None)
            if mood:
                return [SlotSet("current_mood", mood)]

        return []


class ActionShowSustainabilityScore(Action):
    """Show sustainability information for products"""

    def name(self) -> Text:
        return "action_show_sustainability_score"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Get current product context
        # This would integrate with your product database
        
        sustainability_info = {
            "score": 0.78,
            "materials": ["Recycled polyester", "Organic cotton"],
            "carbon_footprint": "2.4 kg CO2",
            "certifications": ["Fair Trade", "GOTS Certified"]
        }

        message = (
            f"🌱 Sustainability Score: {sustainability_info['score']*100:.0f}/100\n"
            f"Materials: {', '.join(sustainability_info['materials'])}\n"
            f"Carbon Footprint: {sustainability_info['carbon_footprint']}\n"
            f"Certifications: {', '.join(sustainability_info['certifications'])}"
        )

        dispatcher.utter_message(text=message)
        return []


class ActionAddToCart(Action):
    """Add product to user's cart"""

    def name(self) -> Text:
        return "action_add_to_cart"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        user_id = tracker.get_slot('user_id')
        # Product ID would be extracted from context
        
        dispatcher.utter_message(
            text="Added to your cart! 🛒 Ready to checkout or want to keep shopping?"
        )
        return []


class ActionSaveConversation(Action):
    """Save conversation to database for analytics"""

    def name(self) -> Text:
        return "action_save_conversation"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        user_id = tracker.get_slot('user_id')
        workspace_id = tracker.get_slot('workspace_id')
        session_id = tracker.get_slot('session_id')
        
        # Get all events from this conversation
        events = tracker.events
        
        # Extract relevant conversation data
        conversation_data = {
            "user_id": user_id,
            "workspace_id": workspace_id,
            "session_id": session_id,
            "messages": [],
            "intents": [],
            "entities": [],
            "sentiment": tracker.get_slot('sentiment'),
            "created_at": datetime.utcnow().isoformat()
        }

        for event in events:
            if event.get('event') == 'user':
                conversation_data['messages'].append({
                    "text": event.get('text'),
                    "intent": event.get('parse_data', {}).get('intent', {}).get('name'),
                    "timestamp": event.get('timestamp')
                })

        try:
            # Save to Next.js API
            requests.post(
                f"{NEXT_API_URL}/chat/history",
                json=conversation_data,
                timeout=5
            )
        except Exception as e:
            print(f"Failed to save conversation: {str(e)}")

        return []


class ActionDefaultFallback(Action):
    """Handle fallback with helpful suggestions"""

    def name(self) -> Text:
        return "action_default_fallback"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        message = (
            "I'm not quite sure what you mean. Here's what I can help with:\n\n"
            "• Product recommendations\n"
            "• Order tracking\n"
            "• Returns & exchanges\n"
            "• Finding eco-friendly products\n"
            "• Mood-based shopping\n\n"
            "What would you like to do?"
        )
        
        dispatcher.utter_message(text=message)
        return []
