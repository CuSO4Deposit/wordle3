{
  description = "A development environment flake wrapper for nextjs.";

  inputs = {
    git-hooks-nix = {
      inputs.nixpkgs.follows = "nixpkgs";
      url = "github:cachix/git-hooks.nix";
    };
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    pre-commit-hooks.url = "github:cachix/git-hooks.nix";
  };

  outputs =
    inputs@{ self, flake-parts, ... }:
    flake-parts.lib.mkFlake
      {
        inherit inputs;
      }
      {
        systems = [
          "x86_64-linux"
          "aarch64-linux"
          "x86_64-darwin"
          "aarch64-darwin"
        ];
        perSystem =
          { pkgs, system, ... }:
          {
            checks = {
              inherit inputs system;
              pre-commit-check = inputs.pre-commit-hooks.lib.${system}.run {
                src = ./.;
                hooks = {
                  eslint = {
                    # It's said that eslint-config-next currently fails. Related issues:
                    # https://github.com/microsoft/rushstack/issues/4965
                    # https://github.com/microsoft/rushstack/issues/5049
                    # https://github.com/microsoft/rushstack/issues/5221
                    # But manually setting binPath seems to be a workaround?
                    enable = true;
                    settings = {
                      binPath = "./node_modules/.bin/eslint";
                      extensions = ".tsx?$";
                    };
                  };
                  markdownlint.enable = true;
                  nixfmt-rfc-style.enable = true;
                  prettier.enable = true;
                };
              };
            };
            devShells = {
              inherit system;
              default = pkgs.mkShellNoCC {
                inherit (self.checks.${system}.pre-commit-check) shellHook;
                buildInputs = [ pkgs.nodejs_24 ] ++ self.checks.${system}.pre-commit-check.enabledPackages;
              };
            };
          };
      };
}
