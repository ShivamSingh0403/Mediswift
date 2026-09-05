from rest_framework import status, permissions
from rest_framework.views import APIView
from apps.common.responses import api_response
from apps.cart.models import Cart, CartItem
from apps.cart.serializers import CartSerializer, CartItemSerializer

def get_or_create_user_cart(request):
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_key=session_key)
    return cart

class CartView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        cart = get_or_create_user_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return api_response(data=serializer.data, message="Cart retrieved successfully.")

class CartItemView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        cart = get_or_create_user_cart(request)
        serializer = CartItemSerializer(data=request.data, context={'cart': cart, 'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(
            data=CartSerializer(cart, context={'request': request}).data,
            message="Item added to cart.",
            status_code=status.HTTP_201_CREATED
        )

class CartItemDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def patch(self, request, item_id):
        cart = get_or_create_user_cart(request)
        try:
            item = cart.items.get(id=item_id)
        except CartItem.DoesNotExist:
            return api_response(message="Item not found in cart.", status_code=status.HTTP_404_NOT_FOUND, success=False)

        qty = request.data.get('quantity')
        if qty is not None:
            if int(qty) <= 0:
                item.delete()
            else:
                item.quantity = int(qty)
                item.save()

        return api_response(
            data=CartSerializer(cart, context={'request': request}).data,
            message="Cart item updated."
        )

    def delete(self, request, item_id):
        cart = get_or_create_user_cart(request)
        cart.items.filter(id=item_id).delete()
        return api_response(
            data=CartSerializer(cart, context={'request': request}).data,
            message="Item removed from cart."
        )
