from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('service_request', '0007_serviceexecution_assigned_to'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_read_by_user', models.BooleanField(default=False)),
                ('is_read_by_workshop', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('execution', models.ForeignKey(on_delete=models.CASCADE, related_name='messages', to='service_request.serviceexecution')),
                ('sender', models.ForeignKey(on_delete=models.CASCADE, related_name='service_messages', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

