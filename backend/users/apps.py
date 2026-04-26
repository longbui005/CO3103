from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # import signals to register post_migrate handlers
        try:
            import users.signals  # noqa: F401
        except Exception:
            # Avoid breaking manage.py commands if imports fail
            pass
