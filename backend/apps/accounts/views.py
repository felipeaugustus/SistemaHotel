from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.views import RedirectURLMixin
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import FormView


@method_decorator([sensitive_post_parameters(), never_cache], name="dispatch")
class RegisterView(RedirectURLMixin, FormView):
    form_class = UserCreationForm
    template_name = "registration/register.html"
    next_page = settings.LOGIN_REDIRECT_URL

    def form_valid(self, form):
        login(self.request, form.save())
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        return super().get_context_data(next=self.get_redirect_url(), **kwargs)
