import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

def run_migrations_online() -> None:
    """Run migrations in 'online' mode with async engine."""

    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL")

    connectable = create_async_engine(
        configuration["sqlalchemy.url"],
        poolclass=pool.NullPool,
    )

    async def do_run_migrations():
        async with connectable.connect() as connection:
            await connection.run_sync(
                lambda sync_conn: context.configure(
                    connection=sync_conn,
                    target_metadata=target_metadata
                )
            )
            await connection.run_sync(context.run_migrations)

    asyncio.run(do_run_migrations())
